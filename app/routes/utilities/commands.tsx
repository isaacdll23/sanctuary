import { useState, useEffect } from "react";
import { useFetcher } from "react-router";
import type { Route } from "./+types/commands";
import { db } from "~/db";
import { utilitiesCommandsTable, utilitiesCommandsVersionsTable } from "~/db/schema";
import { getUserFromSession, requireAuth } from "~/modules/auth.server";
import { eq, desc } from "drizzle-orm";

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
      className={`cursor-pointer flex items-center gap-2 p-2 hover:bg-gray-700 ${isActive ? "bg-gray-700" : ""}`}
    >
      {/* Timeline marker */}
      <div className="w-2 h-2 rounded-full bg-blue-300"></div>
      <div>
        <div className="text-sm text-blue-300">v{version.version}</div>
        <div className="text-xs text-gray-400">{new Date(version.createdAt).toLocaleString()}</div>
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
    <div className="max-h-48 overflow-y-auto border-l-2 border-gray-600 pl-4">
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

export async function loader({ request }: Route.LoaderArgs) {
  await requireAuth(request);

  const user = await getUserFromSession(request);

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
}

export async function action({ request }: Route.ActionArgs) {
  await requireAuth(request);
  const formData = await request.formData();
  const _action = formData.get("_action");

  if (_action === "delete") {
    const id = formData.get("id") as string;
    // Delete all the version history for this command first
    await db.delete(utilitiesCommandsVersionsTable).where(eq(utilitiesCommandsVersionsTable.commandId, Number(id)));
    // Then delete the command record
    await db.delete(utilitiesCommandsTable).where(eq(utilitiesCommandsTable.id, Number(id)));
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
    const currentVersion = versionRecords.length > 0 ? versionRecords[0].version : 0;
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
    <div className="h-full w-full flex flex-col items-center mt-4">
      <div className="flex flex-row justify-between items-center w-4/5 mb-2">
        <h1 className="text-3xl mb-4">Commands</h1>
        <button
          onClick={handleAddCommand}
          className="mb-4 rounded-xl border-2 px-5 py-2 text-sm shadow-sm focus:outline-none focus:ring-2 focus:ring-offset-2 border-gray-800 bg-indigo-600 text-white hover:bg-indigo-700 transition-colors duration-200"
        >
          Add Command
        </button>
      </div>
      <div className="flex flex-col items-center gap-2 w-full">
        {loaderData.userCommands.map((command) => (
          <div
            key={command.id}
            className="p-4 border rounded-lg shadow-md w-4/5 cursor-pointer flex justify-between items-center hover:bg-gray-700 transition-colors duration-200"
            onClick={() => handleEditCommand(command)}
          >
            <h2 className="text-xl font-semibold">{command.title}</h2>
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                handleDeleteCommand(command);
              }}
              className="rounded bg-red-600 px-3 py-1 text-xs text-white hover:bg-red-800"
            >
              Delete
            </button>
          </div>
        ))}
      </div>

      {/* Command Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 flex items-center justify-center bg-black/50 z-50">
          <div className="bg-gray-800 rounded-xl p-6 w-5/6 md:w-4/6 xl:w-3/6 relative max-h-[90vh] overflow-y-auto">
            <h2 className="text-2xl font-bold mb-4">{editingCommand ? "Edit Command" : "Add Command"}</h2>

            {/* Version timeline section */}
            {editingCommand && latestVersions.length > 0 && (
              <div className="mb-4">
                <p className="text-lg text-white mb-2">
                  {currentVersion !== null ? `Viewing Version: v${currentVersion}` : "Select a version:"}
                </p>
                <VersionTimeline
                  versions={latestVersions}
                  currentVersion={currentVersion}
                  onSelectVersion={(selectedVersion) => {
                    setCurrentVersion(selectedVersion.version); // Update the current version state
                    // Submit fetcher request to load specific version
                    fetcher.submit(
                      {
                        _action: "loadVersion",
                        versionId: selectedVersion.id.toString(),
                      },
                      { method: "post" }
                    );
                  }}
                />
              </div>
            )}

            <fetcher.Form method="post" className="flex flex-col gap-4">
              {editingCommand && <input type="hidden" name="id" value={editingCommand.id} />}
              <input type="hidden" name="_action" value={editingCommand ? "update" : "add"} />
              <input
                type="text"
                name="title"
                placeholder="Command Title"
                value={commandTitle}
                onChange={(e) => setCommandTitle(e.target.value)}
                className="w-full border-2 border-gray-500 rounded-xl p-2 text-sm bg-gray-600 text-white"
                required
              />
              <textarea
                name="command"
                placeholder="Enter command code..."
                value={commandContent}
                onChange={(e) => setCommandContent(e.target.value)}
                className="w-full h-64 border-2 border-gray-500 rounded-xl p-2 text-sm bg-gray-600 text-white resize-none"
                required
              />
              <div className="flex flex-row gap-4">
                <button
                  type="submit"
                  disabled={fetcher.state === "submitting"}
                  className="w-full rounded-xl border-2 px-8 py-2 text-sm font-medium shadow-sm focus:outline-none focus:ring-2 focus:ring-offset-2 border-gray-800 bg-indigo-700 text-white hover:bg-blue-800 transition-colors duration-200"
                >
                  {editingCommand ? "Update Command" : "Add Command"}
                </button>
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="w-full rounded-xl border-2 px-8 py-2 text-sm font-medium shadow-sm focus:outline-none focus:ring-2 focus:ring-offset-2 border-gray-800 bg-gray-700 text-white hover:bg-gray-900 transition-colors duration-200"
                >
                  Cancel
                </button>
              </div>
            </fetcher.Form>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {isDeleteModalOpen && deleteTarget && (
        <div className="fixed inset-0 flex items-center justify-center bg-black/50 z-50">
          <div className="bg-gray-800 rounded-xl p-6 w-5/6 md:w-1/3 relative">
            <h2 className="text-2xl font-bold mb-4">Confirm Delete</h2>
            <p className="text-lg text-white mb-6">
              Are you sure you want to delete the command: <span className="font-semibold">{deleteTarget.title}</span>?
            </p>
            <div className="flex flex-row gap-4">
              <fetcher.Form method="post" className="w-full">
                <input type="hidden" name="_action" value="delete" />
                <input type="hidden" name="id" value={deleteTarget.id} />
                <button
                  type="submit"
                  disabled={fetcher.state === "submitting"}
                  className="w-full rounded-xl border-2 px-8 py-2 text-sm font-medium shadow-sm focus:outline-none focus:ring-2 focus:ring-offset-2 border-gray-800 bg-red-700 text-white hover:bg-red-800 transition-colors duration-200"
                >
                  Delete
                </button>
              </fetcher.Form>
              <button
                type="button"
                onClick={() => setIsDeleteModalOpen(false)}
                className="w-full rounded-xl border-2 px-8 py-2 text-sm font-medium shadow-sm focus:outline-none focus:ring-2 focus:ring-offset-2 border-gray-800 bg-gray-700 text-white hover:bg-gray-900 transition-colors duration-200"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
