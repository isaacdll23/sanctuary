import { useState, useEffect, useMemo, useRef } from "react";
import { desc, sql } from "drizzle-orm";
import { useFetcher, useLoaderData, useRevalidator } from "react-router";
import {
  PlusIcon,
  PencilSquareIcon,
  TrashIcon,
  SparklesIcon,
  ChevronLeftIcon, // Added
  ChevronRightIcon, // Added
} from "@heroicons/react/24/outline";
import ReactMarkdown from "react-markdown";
import {
  pageAccessLoader,
  pageAccessAction,
} from "~/modules/middleware/pageAccess";
import type { notesTable, foldersTable } from "~/db/schema";
import { fuzzyMatch } from "~/utils/fuzzyMatch";
import { useToast } from "~/hooks/useToast";
import { NoteEditor } from "~/components/notes/NoteEditor";
import { FolderList } from "~/components/notes/FolderList";
import { NoteList } from "~/components/notes/NoteList";
import { SearchBar } from "~/components/notes/SearchBar";

export function meta() {
  return [{ title: "Notes" }];
}

export const loader = pageAccessLoader("notes", async (user, request) => {
  const { db } = await import("~/db");
  const { notesTable, foldersTable } = await import("~/db/schema");
  const url = new URL(request.url);
  const searchTerm = url.searchParams.get("q") || "";

  const notes = await db
    .select()
    .from(notesTable)
    .where(
      sql`${notesTable.userId} = ${user.id} AND (${
        notesTable.title
      } ILIKE ${`%${searchTerm}%`} OR ${
        notesTable.content
      } ILIKE ${`%${searchTerm}%`})`
    )
    .orderBy(desc(notesTable.updatedAt));

  const folders = await db
    .select()
    .from(foldersTable)
    .where(sql`${foldersTable.userId} = ${user.id}`)
    .orderBy(foldersTable.name);

  return { notes, folders, searchTerm };
});

export const action = pageAccessAction("notes", async (user, request) => {
  const { handleNoteAction } = await import("~/modules/services/NoteService");
  const response = await handleNoteAction(request);
  return response;
});

export default function NotesPage() {
  const {
    notes: initialNotes,
    folders: initialFolders,
    searchTerm: initialSearchTerm,
  } = useLoaderData<typeof loader>();
  const pageActionFetcher = useFetcher<any>(); // Renamed for clarity, handles main page and note save/update actions
  const titleGenerationFetcher = useFetcher<any>(); // New fetcher dedicated to title generation
  const revalidator = useRevalidator();
  const { addToast } = useToast();

  const [searchQuery, setSearchQuery] = useState(initialSearchTerm);
  const [selectedNoteId, setSelectedNoteId] = useState<number | null>(null);
  const [selectedFolderId, setSelectedFolderId] = useState<number | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [showFolderInput, setShowFolderInput] = useState(false);
  const [newFolderName, setNewFolderName] = useState("");
  const [draggedNoteId, setDraggedNoteId] = useState<number | null>(null);
  const [dragOverTargetId, setDragOverTargetId] = useState<
    string | number | null
  >(null);
  const [editingFolderId, setEditingFolderId] = useState<number | null>(null);
  const [editingFolderName, setEditingFolderName] = useState("");
  const [isLeftColumnCollapsed, setIsLeftColumnCollapsed] = useState(() => {
    if (typeof window !== "undefined") {
      return localStorage.getItem("isLeftColumnCollapsed") === "true";
    }
    return false;
  });

  const notes = pageActionFetcher.data?.notes || initialNotes;
  const folders = pageActionFetcher.data?.folders || initialFolders;

  useEffect(() => {
    if (typeof window !== "undefined") {
      localStorage.setItem(
        "isLeftColumnCollapsed",
        String(isLeftColumnCollapsed)
      );
    }
  }, [isLeftColumnCollapsed]);

  const filteredNotes = useMemo(() => {
    let filtered = notes;
    if (selectedFolderId) {
      filtered = filtered.filter((n: any) => n.folderId === selectedFolderId);
    }
    if (searchQuery) {
      filtered = filtered.filter(
        (n: any) =>
          fuzzyMatch(n.title, searchQuery) || fuzzyMatch(n.content, searchQuery)
      );
    }
    return filtered;
  }, [notes, searchQuery, selectedFolderId]);

  const prevFetcherStateRef = useRef(pageActionFetcher.state);
  useEffect(() => {
    const previousState = prevFetcherStateRef.current;
    if (
      pageActionFetcher.state === "idle" &&
      previousState === "loading" &&
      pageActionFetcher.data
    ) {
      const data = pageActionFetcher.data;
      if (data.success) {
        setIsEditing(false);
        setEditingFolderId(null);
        setEditingFolderName("");
        if (data.folders) {
        }
      } else if (data.error) {
        addToast(data.error, "error", 5000);
      }
    }
    prevFetcherStateRef.current = pageActionFetcher.state;
  }, [
    pageActionFetcher.state,
    pageActionFetcher.data,
    revalidator,
    selectedNoteId,
    addToast,
  ]);

  const selectedNote = useMemo(() => {
    return filteredNotes.find((n: any) => n.id === selectedNoteId) || null;
  }, [filteredNotes, selectedNoteId]);

  const handleSearchChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    setSearchQuery(event.target.value);
  };

  const handleSelectNote = (note: typeof notesTable.$inferSelect) => {
    setSelectedNoteId(note.id);
    setIsEditing(false);
  };

  const handleCreateNew = () => {
    setSelectedNoteId(null);
    setIsEditing(true);
  };

  const handleDelete = (noteId: number) => {
    if (window.confirm("Are you sure you want to delete this note?")) {
      pageActionFetcher.submit(
        { intent: "deleteNote", noteId: noteId.toString() },
        { method: "post", action: "/notes" }
      );
      addToast("Note deleted.", "success", 3000);
    }
  };

  const handleFolderSelect = (folderId: number | null) => {
    setSelectedFolderId(folderId);
    setSelectedNoteId(null);
    setIsEditing(false);
  };

  const handleCreateFolder = () => {
    if (!newFolderName.trim()) return;
    pageActionFetcher.submit(
      { intent: "createFolder", name: newFolderName },
      { method: "post", action: "/notes" }
    );
    addToast(`Folder '${newFolderName}' created.`, "success", 3000);
    setNewFolderName("");
    setShowFolderInput(false);
  };

  const handleRenameFolder = (folderId: number) => {
    const folderToRename = folders.find((f: any) => f.id === folderId);
    if (!editingFolderName.trim()) {
      addToast("Folder name cannot be empty.", "error", 3000);
      setEditingFolderId(null);
      setEditingFolderName("");
      return;
    }
    if (folderToRename && folderToRename.name === editingFolderName.trim()) {
      setEditingFolderId(null);
      setEditingFolderName("");
      return;
    }

    pageActionFetcher.submit(
      {
        intent: "renameFolder",
        folderId: folderId.toString(),
        name: editingFolderName,
      },
      { method: "post", action: "/notes" }
    );
    addToast(`Folder renamed to '${editingFolderName}'.`, "success", 3000);
  };

  const handleDeleteFolder = (folderId: number, folderName: string) => {
    if (
      window.confirm(
        `Are you sure you want to delete the folder "${folderName}"? Notes in this folder will be moved to "No Folder".`
      )
    ) {
      pageActionFetcher.submit(
        { intent: "deleteFolder", folderId: folderId.toString() },
        { method: "post", action: "/notes" }
      );
      if (selectedFolderId === folderId) {
        setSelectedFolderId(null);
      }
    }
  };

  const handleToggleLeftColumn = () => {
    setIsLeftColumnCollapsed((prev) => !prev);
  };

  return (
    <div className="flex h-screen bg-slate-900 text-slate-100 relative">
      {/* Toggle Button */}
      <button
        onClick={handleToggleLeftColumn}
        className={`absolute top-1/2 -translate-y-1/2 z-20 p-1 bg-slate-700 hover:bg-slate-600 rounded-full text-white transition-all duration-300 ease-in-out
          ${isLeftColumnCollapsed ? "left-1" : "left-[calc(33.333333%-22px)]"}
        `}
        aria-label={
          isLeftColumnCollapsed ? "Expand sidebar" : "Collapse sidebar"
        }
      >
        {isLeftColumnCollapsed ? (
          <ChevronRightIcon className="h-2 w-2" />
        ) : (
          <ChevronLeftIcon className="h-2 w-2" />
        )}
      </button>

      {/* Left Column */}
      <div
        className={`
          ${
            isLeftColumnCollapsed ? "w-0 p-0" : "w-1/3 p-4"
          } border-r border-slate-700 flex flex-col transition-all duration-300 ease-in-out overflow-hidden
        `}
      >
        {!isLeftColumnCollapsed && (
          <>
            <SearchBar
              searchQuery={searchQuery}
              setSearchQuery={setSearchQuery}
            />
            <button
              onClick={handleCreateNew}
              className="mb-2 w-full flex items-center justify-center px-4 py-2 rounded-lg bg-gradient-to-r from-purple-500 to-pink-600 text-white font-medium hover:from-purple-600 hover:to-pink-700 transition-colors"
            >
              <PlusIcon className="h-5 w-5 mr-2" />
              New Note
            </button>
            <FolderList
              folders={folders}
              selectedFolderId={selectedFolderId}
              setSelectedFolderId={setSelectedFolderId}
              fetcher={pageActionFetcher} // Pass the pageActionFetcher for folder operations
              addToast={addToast}
              draggedNoteId={draggedNoteId}
              setDraggedNoteId={setDraggedNoteId}
              dragOverTargetId={dragOverTargetId}
              setDragOverTargetId={setDragOverTargetId}
              handleDeleteFolder={handleDeleteFolder}
              handleRenameFolder={handleRenameFolder}
              editingFolderId={editingFolderId}
              setEditingFolderId={setEditingFolderId}
              editingFolderName={editingFolderName}
              setEditingFolderName={setEditingFolderName}
              showFolderInput={showFolderInput}
              setShowFolderInput={setShowFolderInput}
              newFolderName={newFolderName}
              setNewFolderName={setNewFolderName}
              handleCreateFolder={handleCreateFolder}
              handleFolderSelect={handleFolderSelect}
            />
            <NoteList
              notes={notes}
              folders={folders}
              filteredNotes={filteredNotes}
              selectedNoteId={selectedNoteId}
              setSelectedNoteId={setSelectedNoteId}
              setIsEditing={setIsEditing}
              setDraggedNoteId={setDraggedNoteId}
              draggedNoteId={draggedNoteId}
            />
          </>
        )}
      </div>
      {/* Right Column */}
      <div
        className={`
        ${
          isLeftColumnCollapsed ? "w-full" : "w-2/3"
        } p-6 overflow-y-auto transition-all duration-300 ease-in-out
        `}
      >
        {isEditing ? (
          <NoteEditor
            key={selectedNote?.id || "new"}
            note={selectedNote}
            fetcher={{
              submit: pageActionFetcher.submit, // For note creation/update
              state: pageActionFetcher.state,
              data: pageActionFetcher.data,
              titleFetcher: titleGenerationFetcher, // Dedicated fetcher for title generation
            }}
            onCancel={() => setIsEditing(false)}
            folderId={selectedFolderId}
            folders={folders}
          />
        ) : selectedNote ? (
          <div className="space-y-4">
            <div className="flex justify-between items-center">
              <h1 className="text-3xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-purple-400 to-pink-600">
                {selectedNote.title}
              </h1>
              <div className="flex space-x-2">
                <button
                  onClick={() => setIsEditing(true)}
                  className="p-2 rounded-md bg-slate-700 hover:bg-slate-600 text-purple-400 transition-colors"
                  aria-label="Edit note"
                >
                  <PencilSquareIcon className="h-5 w-5" />
                </button>
                <button
                  onClick={() => handleDelete(selectedNote.id)}
                  className="p-2 rounded-md bg-slate-700 hover:bg-slate-600 text-red-500 transition-colors"
                  aria-label="Delete note"
                >
                  <TrashIcon className="h-5 w-5" />
                </button>
              </div>
            </div>
            <div className="prose prose-invert prose-sm md:prose-base max-w-none bg-slate-800 p-4 rounded-lg">
              <ReactMarkdown>{selectedNote.content}</ReactMarkdown>
            </div>
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center h-full">
            <div className="text-center">
              <PencilSquareIcon className="h-16 w-16 text-slate-600 mx-auto mb-4" />
              <h2 className="text-xl font-semibold text-slate-400">
                Select a note to view or edit
              </h2>
              <p className="text-slate-500">
                Or, create a new one using the button on the left.
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
