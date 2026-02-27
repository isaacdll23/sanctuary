import { useState, useEffect, useMemo } from "react";
import type { Route } from "./+types/commands";
import { db } from "~/db";
import {
  utilitiesCommandsTable,
  utilitiesCommandsVersionsTable,
} from "~/db/schema";
import { eq, desc, and } from "drizzle-orm";
import { pageAccessAction, pageAccessLoader } from "~/modules/middleware/pageAccess";
import { fuzzyMatch } from "~/utils/fuzzyMatch";
import { parsePositiveInt } from "~/utils/numberParsing";
import { MagnifyingGlassIcon, PlusIcon } from "@heroicons/react/24/outline";
import { CommandCard } from "~/components/utilities/CommandCard";
import { CommandModal } from "~/components/utilities/CommandModal";
import { DeleteConfirmationModal } from "~/components/utilities/DeleteConfirmationModal";
import { EmptyState } from "~/components/utilities/EmptyState";

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

export const action = pageAccessAction("commands", async (user, request) => {
  const formData = await request.formData();
  const _action = formData.get("_action");

  if (_action === "delete") {
    const id = parsePositiveInt(formData.get("id"));
    if (!id) {
      return { error: "Invalid command id" };
    }

    // Delete all the version history for this command first
    await db
      .delete(utilitiesCommandsVersionsTable)
      .where(
        and(
          eq(utilitiesCommandsVersionsTable.commandId, id),
          eq(utilitiesCommandsVersionsTable.userId, user.id)
        )
      );

    // Then delete the command record
    const deletedCommands = await db
      .delete(utilitiesCommandsTable)
      .where(
        and(eq(utilitiesCommandsTable.id, id), eq(utilitiesCommandsTable.userId, user.id))
      )
      .returning({ id: utilitiesCommandsTable.id });

    if (deletedCommands.length === 0) {
      return { error: "Command not found" };
    }

    return { _action: "delete", success: true };
  } else if (_action === "update") {
    const id = parsePositiveInt(formData.get("id"));
    const title = formData.get("title") as string;
    const command = formData.get("command") as string;

    if (!id || !title || !command) {
      return { error: "Invalid input" };
    }

    const existingCommand = await db
      .select({ id: utilitiesCommandsTable.id })
      .from(utilitiesCommandsTable)
      .where(
        and(eq(utilitiesCommandsTable.id, id), eq(utilitiesCommandsTable.userId, user.id))
      )
      .limit(1);

    if (existingCommand.length === 0) {
      return { error: "Command not found" };
    }

    await db
      .update(utilitiesCommandsTable)
      .set({ title })
      .where(
        and(eq(utilitiesCommandsTable.id, id), eq(utilitiesCommandsTable.userId, user.id))
      );

    // Get the latest version for this command and increment it
    const versionRecords = await db
      .select()
      .from(utilitiesCommandsVersionsTable)
      .where(
        and(
          eq(utilitiesCommandsVersionsTable.commandId, id),
          eq(utilitiesCommandsVersionsTable.userId, user.id)
        )
      )
      .orderBy(desc(utilitiesCommandsVersionsTable.version));
    const currentVersion =
      versionRecords.length > 0 ? versionRecords[0].version : 0;
    const newVersion = currentVersion + 1;

    // If the command is the same as the latest version, do not create a new version record
    if (versionRecords.length > 0 && versionRecords[0].command === command) {
      return { _action: "update", newVersion: currentVersion };
    }
    // Otherwise, create a new version record  with the updated command

    await db.insert(utilitiesCommandsVersionsTable).values({
      userId: user.id,
      commandId: id,
      version: newVersion,
      command,
    });
    return { _action: "update", newVersion: newVersion };
  } else if (_action === "loadVersion") {
    const versionId = parsePositiveInt(formData.get("versionId"));
    if (!versionId) return { error: "No version id provided" };

    const versionRecord = await db
      .select()
      .from(utilitiesCommandsVersionsTable)
      .where(
        and(
          eq(utilitiesCommandsVersionsTable.id, versionId),
          eq(utilitiesCommandsVersionsTable.userId, user.id)
        )
      );
    if (versionRecord.length === 0) return { error: "Version not found" };

    // Return the command content in the version with action marker
    return { _action: "loadVersion", command: versionRecord[0].command };
  } else {
    // Default: add new command
    const title = formData.get("title") as string;
    const command = formData.get("command") as string;

    if (!title || !command) {
      return { error: "Invalid input" };
    }

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
});

export default function Commands({ loaderData }: Route.ComponentProps) {
  // Search and filtering
  const [searchQuery, setSearchQuery] = useState("");
  const filteredCommands = useMemo(
    () =>
      loaderData.userCommands.filter((cmd: any) =>
        fuzzyMatch(cmd.title, searchQuery)
      ),
    [loaderData.userCommands, searchQuery]
  );

  // Modal states
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);

  // Command editing state
  const [editingCommand, setEditingCommand] = useState<any>(null);
  const [commandTitle, setCommandTitle] = useState("");
  const [commandContent, setCommandContent] = useState("");
  const [currentVersion, setCurrentVersion] = useState<number | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<any>(null);
  const [lastSubmitTime, setLastSubmitTime] = useState(0);

  // Initialize fields only when modal first opens with a command (not on every change)
  useEffect(() => {
    if (editingCommand && isModalOpen) {
      setCommandTitle(editingCommand.title);
      const versionsForCommand = loaderData.userCommandVersions
        .filter((v: any) => v.commandId === editingCommand.id)
        .sort((a: any, b: any) => b.version - a.version);
      if (versionsForCommand.length > 0) {
        setCommandContent(versionsForCommand[0].command);
        setCurrentVersion(versionsForCommand[0].version);
      } else {
        setCommandContent("");
        setCurrentVersion(null);
      }
    }
  }, [editingCommand, isModalOpen]);

  // Handle opening modal for adding new command
  const handleAddCommand = () => {
    setEditingCommand(null);
    setCommandTitle("");
    setCommandContent("");
    setCurrentVersion(1);
    setIsModalOpen(true);
  };

  // Handle opening modal for editing command
  const handleEditCommand = (command: any) => {
    setEditingCommand(command);
    setIsModalOpen(true);
  };

  // Handle delete confirmation
  const handleDeleteCommand = (command: any) => {
    setDeleteTarget(command);
    setIsDeleteModalOpen(true);
  };

  // Helper function to get version count
  const getVersionCount = (commandId: number) => {
    return loaderData.userCommandVersions.filter(
      (v: any) => v.commandId === commandId
    ).length;
  };

  return (
    <div className="min-h-screen bg-transparent text-gray-100 p-4 md:p-8">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <header className="mb-8 md:mb-12 flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <div className="w-full md:w-auto">
            <h1 className="text-4xl md:text-5xl font-extrabold tracking-tight mb-2 text-gray-900 dark:text-gray-100">
              Commands
            </h1>
            <p className="text-lg text-gray-600 dark:text-gray-400">
              Store and manage your frequently used command snippets.
            </p>
          </div>
          <button
            onClick={handleAddCommand}
            className="flex items-center gap-2 px-4 py-2.5 bg-gray-900 dark:bg-gray-800 hover:bg-gray-800 dark:hover:bg-gray-700 text-white dark:text-gray-100 font-semibold text-sm rounded-lg shadow-sm hover:shadow-md transition-all duration-150 focus:outline-none focus:ring-2 focus:ring-gray-400 dark:focus:ring-gray-600 min-h-[40px]"
            aria-label="Create a new command"
          >
            <PlusIcon className="h-4 w-4" />
            <span>New Command</span>
          </button>
        </header>

        {/* Search Bar */}
        <div className="relative mb-6">
          <div className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none">
            <MagnifyingGlassIcon className="h-5 w-5 text-gray-500 dark:text-gray-400" />
          </div>
          <input
            type="text"
            id="search-commands"
            placeholder="Search commands..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="block w-full p-3 pl-10 bg-gray-100 dark:bg-gray-800 border border-gray-300 dark:border-gray-700 text-gray-900 dark:text-gray-100 rounded-lg focus:outline-none focus:ring-2 focus:ring-gray-400 dark:focus:ring-gray-600 transition-all duration-150"
          />
        </div>

        {/* Command List */}
        {loaderData.userCommands.length === 0 ? (
          <EmptyState onCreateNew={handleAddCommand} />
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-6">
            {filteredCommands.map((command, index) => (
              <CommandCard
                key={command.id}
                command={command}
                versionCount={getVersionCount(command.id)}
                onEdit={handleEditCommand}
                onDelete={handleDeleteCommand}
                index={index}
              />
            ))}
          </div>
        )}

        {/* Modals */}
        <CommandModal
          isOpen={isModalOpen}
          onClose={() => {
            setIsModalOpen(false);
            setEditingCommand(null);
          }}
          editingCommand={editingCommand}
          commandTitle={commandTitle}
          commandContent={commandContent}
          currentVersion={currentVersion}
          allVersions={loaderData.userCommandVersions}
          onTitleChange={setCommandTitle}
          onContentChange={setCommandContent}
          onCurrentVersionChange={setCurrentVersion}
          onLastSubmitTimeChange={setLastSubmitTime}
          lastSubmitTime={lastSubmitTime}
        />

        <DeleteConfirmationModal
          isOpen={isDeleteModalOpen}
          onClose={() => {
            setIsDeleteModalOpen(false);
            setDeleteTarget(null);
          }}
          targetCommand={deleteTarget}
          onLastSubmitTimeChange={setLastSubmitTime}
          lastSubmitTime={lastSubmitTime}
        />
      </div>
    </div>
  );
}
