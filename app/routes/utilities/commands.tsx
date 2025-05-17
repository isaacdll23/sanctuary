import { useState, useEffect, useMemo, type ChangeEvent } from "react";
import { useFetcher } from "react-router";
import type { Route } from "./+types/commands";
import { db } from "~/db";
import {
  utilitiesCommandsTable,
  utilitiesCommandsVersionsTable,
} from "~/db/schema";
import { getUserFromSession, requireAuth } from "~/modules/auth.server";
import { eq, desc } from "drizzle-orm";
import { pageAccessLoader } from "~/modules/middleware/pageAccess";
import { fuzzyMatch } from "~/utils/fuzzyMatch";
import { MagnifyingGlassIcon } from "@heroicons/react/24/outline";

function VersionTimelineItem({
  version,
  isActive,
  onSelect,
}: {
  version: any;
  isActive: boolean;
  onSelect: () => void;
}) {
  return (
    <div
      onClick={onSelect}
      className={`cursor-pointer flex items-center gap-2.5 p-2.5 rounded-md transition-colors ${
        isActive ? "bg-indigo-800/50" : "hover:bg-slate-700/50"
      }`}
    >
      {/* Timeline marker */}
      <div
        className={`w-2.5 h-2.5 rounded-full ${
          isActive ? "bg-indigo-400" : "bg-slate-500"
        }`}
      ></div>
      <div>
        <div
          className={`text-sm ${
            isActive ? "text-indigo-300 font-medium" : "text-slate-300"
          }`}
        >
          v{version.version}
        </div>
        <div className="text-xs text-slate-500">
          {new Date(version.createdAt).toLocaleString()}
        </div>
      </div>
    </div>
  );
}

function VersionTimeline({
  versions,
  currentVersion,
  onSelectVersion,
}: {
  versions: any[];
  currentVersion: number | null;
  onSelectVersion: (version: any) => void;
}) {
  return (
    <div className="border-l-2 border-slate-700 pl-4 space-y-1 max-h-60 overflow-y-auto pr-2 custom-scrollbar">
      {versions.map((version) => (
        <VersionTimelineItem
          key={version.id}
          version={version}
          isActive={currentVersion === version.version}
          onSelect={() => onSelectVersion(version)}
        />
      ))}
    </div>
  );
}

export function meta({}: Route.MetaArgs) {
  return [{ title: "Commands" }];
}

export const loader = pageAccessLoader("commands", async (user, request) => {
  const userCommands = await db
    .select()
    .from(utilitiesCommandsTable)
    .where(eq(utilitiesCommandsTable.userId, user.id))
    .orderBy(desc(utilitiesCommandsTable.createdAt));

  const userCommandVersions = await db
    .select()
    .from(utilitiesCommandsVersionsTable)
    .where(eq(utilitiesCommandsVersionsTable.userId, user.id))
    .orderBy(desc(utilitiesCommandsVersionsTable.createdAt));

  return { userCommands, userCommandVersions };
});

export async function action({ request }: Route.ActionArgs) {
  await requireAuth(request);
  const formData = await request.formData();
  const _action = formData.get("_action");

  if (_action === "delete") {
    const id = formData.get("id") as string;
    // Delete all the version history for this command first
    await db
      .delete(utilitiesCommandsVersionsTable)
      .where(eq(utilitiesCommandsVersionsTable.commandId, Number(id)));
    // Then delete the command record
    await db
      .delete(utilitiesCommandsTable)
      .where(eq(utilitiesCommandsTable.id, Number(id)));
    return;
  } else if (_action === "update") {
    const id = formData.get("id") as string;
    const title = formData.get("title") as string;
    const command = formData.get("command") as string;

    if (!title || !command) {
      return { error: "Invalid input" };
    }
    await db
      .update(utilitiesCommandsTable)
      .set({ title })
      .where(eq(utilitiesCommandsTable.id, Number(id)));

    const user = await getUserFromSession(request);

    // Get the latest version for this command and increment it
    const versionRecords = await db
      .select()
      .from(utilitiesCommandsVersionsTable)
      .where(eq(utilitiesCommandsVersionsTable.commandId, Number(id)))
      .orderBy(desc(utilitiesCommandsVersionsTable.version));
    const currentVersion =
      versionRecords.length > 0 ? versionRecords[0].version : 0;
    const newVersion = currentVersion + 1;

    // If the command is the same as the latest version, do not create a new version record
    if (versionRecords.length > 0 && versionRecords[0].command === command) {
      return { newVersion: currentVersion };
    }
    // Otherwise, create a new version record  with the updated command

    await db.insert(utilitiesCommandsVersionsTable).values({
      userId: user.id,
      commandId: Number(id),
      version: newVersion,
      command,
    });
    return { newVersion: newVersion };
  } else if (_action === "loadVersion") {
    const versionId = formData.get("versionId") as string;
    if (!versionId) return { error: "No version id provided" };

    const versionRecord = await db
      .select()
      .from(utilitiesCommandsVersionsTable)
      .where(eq(utilitiesCommandsVersionsTable.id, Number(versionId)));
    if (versionRecord.length === 0) return { error: "Version not found" };

    // Return the command content in the version
    return { command: versionRecord[0].command };
  } else {
    // Default: add new command
    const title = formData.get("title") as string;
    const command = formData.get("command") as string;

    if (!title || !command) {
      return { error: "Invalid input" };
    }

    const user = await getUserFromSession(request);
    // Insert new command
    const result = await db
      .insert(utilitiesCommandsTable)
      .values({
        userId: user.id,
        title,
      })
      .returning();
    const newCommandId = result[0].id;
    // Also create an initial version record
    await db.insert(utilitiesCommandsVersionsTable).values({
      userId: user.id,
      commandId: newCommandId,
      version: 1,
      command,
    });
  }
}

export default function Commands({ loaderData }: Route.ComponentProps) {
  const fetcher = useFetcher();
  const [searchQuery, setSearchQuery] = useState("");
  // Filter commands based on fuzzy search against title
  const filteredCommands = useMemo(
    () =>
      loaderData.userCommands.filter((cmd: any) =>
        fuzzyMatch(cmd.title, searchQuery)
      ),
    [loaderData.userCommands, searchQuery]
  );
  const [isModalOpen, setIsModalOpen] = useState(false);

  // if editingCommand is set, we are in update mode (otherwise add mode)
  const [editingCommand, setEditingCommand] = useState<any>(null);
  const [commandTitle, setCommandTitle] = useState("");
  const [commandContent, setCommandContent] = useState("");

  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<any>(null);

  const [currentVersion, setCurrentVersion] = useState<number | null>(null);

  // When modal is opened for update mode, populate fields
  useEffect(() => {
    if (editingCommand) {
      setCommandTitle(editingCommand.title);
    }
  }, [editingCommand]);

  // Check if fetcher returned loadVersion result and update the command editor
  useEffect(() => {
    if (fetcher.data) {
      if (fetcher.data.newVersion) {
        // When an update returns a newVersion value, update the state
        setCurrentVersion(fetcher.data.newVersion);
      } else if (fetcher.data.command) {
        // When loading a specific version
        setCommandContent(fetcher.data.command);
      }
    }
  }, [fetcher.data]);

  // New logic to close the confirmation modal (and others) once a record is deleted
  useEffect(() => {
    if (fetcher.state === "idle" && fetcher.data === undefined) {
      setIsModalOpen(false);
      setEditingCommand(null);
      setIsDeleteModalOpen(false);
      setDeleteTarget(null);
    }
  }, [fetcher.state, fetcher.data]);

  const latestVersions = editingCommand
    ? loaderData.userCommandVersions
        .filter((v: any) => v.commandId === editingCommand.id)
        .sort((a: any, b: any) => b.version - a.version)
    : [];

  const handleEditCommand = (command: any) => {
    setEditingCommand(command);
    setCommandTitle(command.title);
    const versionsForCommand = loaderData.userCommandVersions
      .filter((v: any) => v.commandId === command.id)
      .sort((a: any, b: any) => b.version - a.version);
    if (versionsForCommand.length > 0) {
      setCommandContent(versionsForCommand[0].command);
      setCurrentVersion(versionsForCommand[0].version);
    } else {
      setCommandContent("");
      setCurrentVersion(null);
    }
    setIsModalOpen(true);
  };

  // Handle opening the modal to add a new command
  const handleAddCommand = () => {
    setEditingCommand(null);
    setCommandTitle("");
    setCommandContent("");
    setCurrentVersion(1);
    setIsModalOpen(true);
  };

  const handleDeleteCommand = (command: any) => {
    setDeleteTarget(command);
    setIsDeleteModalOpen(true);
  };

  return (
    <div className="min-h-screen bg-slate-900 text-slate-100 p-4 md:p-8">
      <div className="max-w-7xl mx-auto">
        {" "}
        {/* Header */}
        <header className="mb-8 md:mb-12 flex flex-col md:flex-row justify-between items-center gap-4">
          <div className="w-full md:w-auto">
            <h1 className="text-4xl sm:text-5xl font-extrabold tracking-tight text-center md:text-left">
              <span className="bg-clip-text text-transparent bg-gradient-to-r from-indigo-400 to-purple-600">
                Commands
              </span>
            </h1>
            <p className="mt-2 text-lg text-slate-400 text-center md:text-left max-w-2xl">
              Store and manage your frequently used command snippets for quick
              access.
            </p>
          </div>{" "}
          <button
            onClick={handleAddCommand}
            className="flex items-center gap-2 bg-gradient-to-r from-indigo-500 to-purple-500 hover:from-indigo-600 hover:to-purple-600 text-white font-semibold py-2.5 px-6 rounded-lg shadow-md hover:shadow-xl transition-all duration-300 transform hover:scale-105 focus:outline-none focus:ring-2 focus:ring-indigo-400 focus:ring-opacity-75"
            aria-label="Create a new command"
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              className="h-5 w-5 group-hover:animate-pulse"
              viewBox="0 0 20 20"
              fill="currentColor"
            >
              <path
                fillRule="evenodd"
                d="M10 3a1 1 0 011 1v5h5a1 1 0 110 2h-5v5a1 1 0 11-2 0v-5H4a1 1 0 110-2h5V4a1 1 0 011-1z"
                clipRule="evenodd"
              />
            </svg>
            <span>New Command</span>
          </button>
        </header>
        {/* Search input for fuzzy filtering */}
        <div className="relative mb-4">
          <div className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none">
            <MagnifyingGlassIcon className="h-5 w-5 text-slate-400" />
          </div>
          <input
            type="text"
            id="search-commands"
            placeholder="Search commands..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="block w-full p-3 pl-10 bg-slate-800 border border-slate-700 text-slate-100 rounded-lg focus:ring-2 focus:ring-indigo-500"
          />
        </div>
        {/* Command List */}
        {loaderData.userCommands.length === 0 ? (
          <div className="text-center py-16 px-4 bg-slate-800/60 backdrop-blur-md rounded-3xl border border-slate-700 shadow-lg max-w-xl mx-auto">
            <div className="p-6 bg-indigo-500/10 rounded-full inline-flex mb-6">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                fill="none"
                viewBox="0 0 24 24"
                strokeWidth={1.5}
                stroke="currentColor"
                className="w-16 h-16 text-indigo-400"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M6.75 7.5l3 2.25-3 2.25m4.5 0h3m-9 8.25h13.5A2.25 2.25 0 0021 18V6a2.25 2.25 0 00-2.25-2.25H5.25A2.25 2.25 0 003 6v12a2.25 2.25 0 002.25 2.25z"
                />
              </svg>
            </div>
            <h2 className="text-2xl font-bold text-white mb-2">
              No Commands Found
            </h2>
            <p className="text-slate-400 text-lg mb-6">
              You haven't created any command snippets yet.
            </p>
            <p className="text-slate-500 text-sm mb-8">
              Add your first command to start building your collection of useful
              snippets.
            </p>
            <button
              onClick={handleAddCommand}
              className="inline-flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-indigo-500 to-purple-500 hover:from-indigo-600 hover:to-purple-600 text-white font-medium rounded-lg shadow-lg hover:shadow-indigo-500/20 transition-all duration-300"
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                className="h-5 w-5"
                viewBox="0 0 20 20"
                fill="currentColor"
              >
                <path
                  fillRule="evenodd"
                  d="M10 3a1 1 0 011 1v5h5a1 1 0 110 2h-5v5a1 1 0 11-2 0v-5H4a1 1 0 110-2h5V4a1 1 0 011-1z"
                  clipRule="evenodd"
                />
              </svg>
              Create Your First Command
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-6">
            {" "}
            {filteredCommands.map((command, index) => (
              <div
                key={command.id}
                onClick={() => handleEditCommand(command)}
                className="bg-slate-800/80 backdrop-blur-md border border-slate-700 rounded-2xl shadow-xl p-5 hover:shadow-indigo-500/10 hover:border-slate-600 transition-all duration-300 cursor-pointer group animate-fade-in relative overflow-hidden"
                style={{ animationDelay: `${index * 0.05}s` }}
              >
                <div className="flex justify-between items-start">
                  <h2 className="text-xl font-semibold text-slate-200 group-hover:text-white transition-colors line-clamp-2 mb-2">
                    {command.title}
                  </h2>
                  <div className="flex gap-2">
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleDeleteCommand(command);
                      }}
                      className="p-1.5 rounded-full bg-slate-700/50 hover:bg-red-900/80 text-slate-400 hover:text-white transition-colors focus:outline-none focus:ring-2 focus:ring-red-400/50"
                      aria-label="Delete command"
                    >
                      <svg
                        xmlns="http://www.w3.org/2000/svg"
                        className="h-4 w-4"
                        viewBox="0 0 20 20"
                        fill="currentColor"
                      >
                        <path
                          fillRule="evenodd"
                          d="M9 2a1 1 0 00-.894.553L7.382 4H4a1 1 0 000 2v10a2 2 0 002 2h8a2 2 0 002-2V6a1 1 0 100-2h-3.382l-.724-1.447A1 1 0 0011 2H9zM7 8a1 1 0 012 0v6a1 1 0 11-2 0V8zm5-1a1 1 0 00-1 1v6a1 1 0 102 0V8a1 1 0 00-1-1z"
                          clipRule="evenodd"
                        />
                      </svg>
                    </button>
                  </div>
                </div>
                <div className="absolute inset-0 bg-gradient-to-br from-indigo-600/5 to-purple-600/5 opacity-0 group-hover:opacity-100 rounded-2xl transition-opacity duration-300 pointer-events-none"></div>
                {/* Version count badge */}
                {(() => {
                  const versionCount = loaderData.userCommandVersions.filter(
                    (v: any) => v.commandId === command.id
                  ).length;
                  return (
                    <div className="flex items-center justify-between gap-1.5 mt-4 text-xs relative z-10">
                      <div className="flex items-center gap-1.5 bg-slate-700/40 px-2 py-1 rounded-full">
                        <svg
                          xmlns="http://www.w3.org/2000/svg"
                          className="h-3.5 w-3.5 text-indigo-400"
                          fill="none"
                          viewBox="0 0 24 24"
                          stroke="currentColor"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
                          />
                        </svg>
                        <span className="text-slate-300">
                          {versionCount}{" "}
                          {versionCount === 1 ? "version" : "versions"}
                        </span>
                      </div>
                      <span className="text-slate-500 mr-1">
                        {new Date(command.createdAt).toLocaleDateString()}
                      </span>
                    </div>
                  );
                })()}
                <div className="mt-3 flex items-center relative z-10">
                  <div className="text-indigo-400 group-hover:text-indigo-300 text-sm font-medium flex items-center gap-1 transition-all duration-300">
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      className="h-4 w-4 group-hover:translate-x-0.5 transition-transform"
                      viewBox="0 0 20 20"
                      fill="currentColor"
                    >
                      <path
                        fillRule="evenodd"
                        d="M12.316 3.051a1 1 0 01.633 1.265l-4 12a1 1 0 11-1.898-.632l4-12a1 1 0 011.265-.633zM5.707 6.293a1 1 0 010 1.414L3.414 10l2.293 2.293a1 1 0 11-1.414 1.414l-3-3a1 1 0 010-1.414l3-3a1 1 0 011.414 0zm8.586 0a1 1 0 011.414 0l3 3a1 1 0 010 1.414l-3 3a1 1 0 11-1.414-1.414L16.586 10l-2.293-2.293a1 1 0 010-1.414z"
                        clipRule="evenodd"
                      />
                    </svg>
                    <span>View Details</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
        {/* Command Modal */}
        {isModalOpen && (
          <div className="fixed inset-0 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4 z-50">
            <div className="bg-slate-800 border border-slate-700 rounded-2xl shadow-2xl w-full max-w-4xl relative transform transition-all duration-300 ease-out scale-95 opacity-0 animate-modal-pop-in max-h-[90vh] overflow-hidden flex flex-col">
              {/* Modal Header */}
              <div className="flex justify-between items-center p-6 border-b border-slate-700">
                <h2 className="text-2xl font-semibold bg-clip-text text-transparent bg-gradient-to-r from-indigo-400 to-purple-600">
                  {editingCommand ? "Edit Command" : "New Command"}
                </h2>
                <button
                  onClick={() => setIsModalOpen(false)}
                  className="text-slate-400 hover:text-slate-200 transition-colors"
                  aria-label="Close modal"
                >
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    className="h-6 w-6"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M6 18L18 6M6 6l12 12"
                    />
                  </svg>
                </button>
              </div>

              {/* Modal Content */}
              <div className="p-6 overflow-y-auto flex-grow">
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                  {/* Left Column - Command Form */}
                  <div className="lg:col-span-2">
                    <fetcher.Form method="post" className="space-y-6">
                      {editingCommand && (
                        <input
                          type="hidden"
                          name="id"
                          value={editingCommand.id}
                        />
                      )}
                      <input
                        type="hidden"
                        name="_action"
                        value={editingCommand ? "update" : "add"}
                      />

                      <div>
                        <label
                          htmlFor="command-title"
                          className="block text-sm font-medium text-slate-300 mb-1"
                        >
                          Command Title
                        </label>
                        <input
                          id="command-title"
                          type="text"
                          name="title"
                          placeholder="Give your command a descriptive title"
                          value={commandTitle}
                          onChange={(e) => setCommandTitle(e.target.value)}
                          className="w-full px-4 py-3 bg-slate-700/50 border border-slate-600 text-slate-100 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-colors"
                          required
                        />
                      </div>

                      <div>
                        <label
                          htmlFor="command-content"
                          className="block text-sm font-medium text-slate-300 mb-1"
                        >
                          Command Content
                        </label>
                        <div className="relative">
                          <textarea
                            id="command-content"
                            name="command"
                            placeholder="Enter your command code here..."
                            value={commandContent}
                            onChange={(e) => setCommandContent(e.target.value)}
                            className="w-full h-80 px-4 py-3 bg-slate-700/50 border border-slate-600 text-slate-100 rounded-lg text-sm font-mono focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-colors"
                            required
                            style={{ resize: "none" }}
                          />
                          <div className="absolute right-2 bottom-2 text-xs text-slate-500">
                            {commandContent.length} characters
                          </div>
                        </div>
                      </div>

                      <div className="flex gap-4">
                        <button
                          type="submit"
                          disabled={fetcher.state === "submitting"}
                          className="flex-1 inline-flex justify-center items-center gap-2 bg-gradient-to-r from-indigo-500 to-purple-600 hover:from-indigo-600 hover:to-purple-700 text-white font-medium py-2.5 px-4 rounded-lg transition-all duration-300 shadow-sm hover:shadow-lg focus:outline-none focus:ring-2 focus:ring-indigo-400 focus:ring-opacity-75"
                        >
                          {fetcher.state === "submitting" ? (
                            <>
                              <svg
                                className="animate-spin -ml-1 mr-2 h-4 w-4 text-white"
                                xmlns="http://www.w3.org/2000/svg"
                                fill="none"
                                viewBox="0 0 24 24"
                              >
                                <circle
                                  className="opacity-25"
                                  cx="12"
                                  cy="12"
                                  r="10"
                                  stroke="currentColor"
                                  strokeWidth="4"
                                ></circle>
                                <path
                                  className="opacity-75"
                                  fill="currentColor"
                                  d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                                ></path>
                              </svg>
                              {editingCommand ? "Saving..." : "Creating..."}
                            </>
                          ) : (
                            <>
                              {editingCommand ? (
                                <>
                                  <svg
                                    xmlns="http://www.w3.org/2000/svg"
                                    className="h-5 w-5"
                                    viewBox="0 0 20 20"
                                    fill="currentColor"
                                  >
                                    <path d="M7.707 10.293a1 1 0 10-1.414 1.414l3 3a1 1 0 001.414 0l3-3a1 1 0 00-1.414-1.414L11 11.586V6h5a2 2 0 012 2v7a2 2 0 01-2 2H4a2 2 0 01-2-2V8a2 2 0 012-2h5v5.586l-1.293-1.293zM9 4a1 1 0 012 0v2H9V4z" />
                                  </svg>
                                  Save Changes
                                </>
                              ) : (
                                <>
                                  <svg
                                    xmlns="http://www.w3.org/2000/svg"
                                    className="h-5 w-5"
                                    viewBox="0 0 20 20"
                                    fill="currentColor"
                                  >
                                    <path
                                      fillRule="evenodd"
                                      d="M10 3a1 1 0 011 1v5h5a1 1 0 110 2h-5v5a1 1 0 11-2 0v-5H4a1 1 0 110-2h5V4a1 1 0 011-1z"
                                      clipRule="evenodd"
                                    />
                                  </svg>
                                  Create Command
                                </>
                              )}
                            </>
                          )}
                        </button>

                        <button
                          type="button"
                          onClick={() => setIsModalOpen(false)}
                          className="flex-1 py-2.5 px-4 border border-slate-600 rounded-lg text-slate-300 hover:bg-slate-700 hover:text-white transition-colors duration-200"
                        >
                          Cancel
                        </button>
                      </div>
                    </fetcher.Form>
                  </div>

                  {/* Right Column - Version History */}
                  {editingCommand && (
                    <div>
                      <h3 className="text-lg font-medium text-slate-200 mb-4 flex items-center gap-2">
                        <svg
                          xmlns="http://www.w3.org/2000/svg"
                          className="h-5 w-5 text-indigo-400"
                          fill="none"
                          viewBox="0 0 24 24"
                          stroke="currentColor"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
                          />
                        </svg>
                        Version History
                      </h3>
                      {latestVersions.length === 0 ? (
                        <div className="text-center p-4 bg-slate-700/30 rounded-lg">
                          <p className="text-slate-400">
                            No version history available.
                          </p>
                        </div>
                      ) : (
                        <>
                          <div className="mb-3 text-sm text-slate-400">
                            {currentVersion !== null && (
                              <p>Currently viewing version {currentVersion}</p>
                            )}
                          </div>
                          <VersionTimeline
                            versions={latestVersions}
                            currentVersion={currentVersion}
                            onSelectVersion={(selectedVersion) => {
                              setCurrentVersion(selectedVersion.version);
                              fetcher.submit(
                                {
                                  _action: "loadVersion",
                                  versionId: selectedVersion.id.toString(),
                                },
                                { method: "post" }
                              );
                            }}
                          />
                        </>
                      )}
                      <div className="mt-6 p-4 bg-slate-700/30 rounded-lg">
                        <h4 className="text-sm font-medium text-slate-300 mb-2">
                          About Versioning
                        </h4>
                        <p className="text-xs text-slate-400">
                          Each time you save changes to a command, a new version
                          is created. You can view and restore any previous
                          version at any time.
                        </p>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        )}
        {/* Delete Confirmation Modal */}
        {isDeleteModalOpen && deleteTarget && (
          <div className="fixed inset-0 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4 z-50">
            <div className="bg-slate-800 border border-slate-700 rounded-2xl shadow-2xl p-6 w-full max-w-md relative transform transition-all duration-300 ease-out scale-95 opacity-0 animate-modal-pop-in">
              <div className="flex items-center gap-4 mb-4 text-red-400">
                <div className="p-3 rounded-xl bg-red-500/20">
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    className="h-6 w-6"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
                    />
                  </svg>
                </div>
                <h2 className="text-2xl font-semibold">Delete Command</h2>
              </div>

              <p className="mb-6 text-slate-300">
                Are you sure you want to delete "
                <span className="font-medium">{deleteTarget.title}</span>"? This
                action cannot be undone and all versions will be permanently
                removed.
              </p>

              <div className="flex flex-col sm:flex-row gap-3">
                <fetcher.Form method="post" className="flex-1">
                  <input type="hidden" name="_action" value="delete" />
                  <input type="hidden" name="id" value={deleteTarget.id} />
                  <button
                    type="submit"
                    disabled={fetcher.state === "submitting"}
                    className="w-full inline-flex justify-center items-center gap-2 bg-red-600 hover:bg-red-700 text-white font-medium py-2.5 px-4 rounded-lg transition-colors focus:outline-none focus:ring-2 focus:ring-red-400 focus:ring-opacity-75"
                  >
                    {fetcher.state === "submitting" ? (
                      <>
                        <svg
                          className="animate-spin -ml-1 mr-2 h-4 w-4 text-white"
                          xmlns="http://www.w3.org/2000/svg"
                          fill="none"
                          viewBox="0 0 24 24"
                        >
                          <circle
                            className="opacity-25"
                            cx="12"
                            cy="12"
                            r="10"
                            stroke="currentColor"
                            strokeWidth="4"
                          ></circle>
                          <path
                            className="opacity-75"
                            fill="currentColor"
                            d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                          ></path>
                        </svg>
                        Deleting...
                      </>
                    ) : (
                      <>Yes, Delete Command</>
                    )}
                  </button>
                </fetcher.Form>
                <button
                  type="button"
                  onClick={() => setIsDeleteModalOpen(false)}
                  className="flex-1 py-2.5 px-4 border border-slate-600 rounded-lg text-slate-300 hover:bg-slate-700 hover:text-white transition-colors duration-200"
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
