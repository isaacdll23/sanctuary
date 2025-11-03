import { useState, useEffect, useMemo, useRef } from "react";
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
import { HierarchicalNotesList } from "~/components/notes/HierarchicalNotesList";
import { SearchBar } from "~/components/notes/SearchBar";

export function meta() {
  return [{ title: "Notes" }];
}

export const loader = pageAccessLoader("notes", async (user, request) => {
  const { getNotes, getFolders } = await import(
    "~/modules/services/NoteService"
  );
  const url = new URL(request.url);
  const searchTerm = url.searchParams.get("q") || "";

  // Get all notes (which will be decrypted by NoteService)
  const allNotes = await getNotes(user.id);

  // Filter by search term on decrypted content
  const notes = allNotes.filter(
    (note) =>
      note.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      note.content.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const folders = await getFolders(user.id);

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
    <div className="flex h-screen bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100 relative">
      {/* Toggle Button */}
      <button
        onClick={handleToggleLeftColumn}
        className={`absolute top-1/2 -translate-y-1/2 z-20 p-2 rounded-full bg-gray-300 dark:bg-gray-700 hover:bg-gray-400 dark:hover:bg-gray-600 text-gray-900 dark:text-gray-100 transition-all duration-300 ease-in-out focus:outline-none focus:ring-2 focus:ring-gray-400 dark:focus:ring-gray-600 ${
          isLeftColumnCollapsed ? "left-2" : "left-[calc(33.333333%-24px)]"
        }`}
        aria-label={
          isLeftColumnCollapsed ? "Expand sidebar" : "Collapse sidebar"
        }
        title={isLeftColumnCollapsed ? "Expand sidebar" : "Collapse sidebar"}
      >
        {isLeftColumnCollapsed ? (
          <ChevronRightIcon className="h-5 w-5" />
        ) : (
          <ChevronLeftIcon className="h-5 w-5" />
        )}
      </button>

      {/* Left Column - Sidebar */}
      <div
        className={`${
          isLeftColumnCollapsed ? "w-0 p-0" : "w-1/3 p-4"
        } border-r border-gray-200 dark:border-gray-700 flex flex-col transition-all duration-300 ease-in-out overflow-hidden bg-gray-50 dark:bg-gray-800`}
      >
        {!isLeftColumnCollapsed && (
          <>
            {/* Search Bar */}
            <div className="mb-4">
              <SearchBar
                searchQuery={searchQuery}
                setSearchQuery={setSearchQuery}
              />
            </div>

            {/* New Note Button */}
            <button
              onClick={handleCreateNew}
              className="mb-4 w-full flex items-center justify-center px-3 py-2.5 rounded-lg bg-gray-900 dark:bg-gray-100 text-white dark:text-gray-900 font-medium hover:bg-gray-800 dark:hover:bg-gray-200 focus:outline-none focus:ring-2 focus:ring-gray-400 dark:focus:ring-gray-600 transition-all duration-150 min-h-[40px] shadow-sm"
            >
              <PlusIcon className="h-5 w-5 mr-2" />
              New Note
            </button>

            {/* Hierarchical Folders & Notes List */}
            <div className="min-h-0 flex flex-col flex-grow">
              <div className="flex items-center gap-2 px-1 mb-3 pb-2 border-b border-gray-300 dark:border-gray-700">
                <div className="h-0.5 w-1 bg-gray-900 dark:bg-gray-100 rounded-full"></div>
                <h2 className="text-xs font-bold uppercase tracking-widest text-gray-700 dark:text-gray-300">
                  Folders & Notes
                </h2>
              </div>
              <HierarchicalNotesList
                folders={folders}
                notes={notes}
                selectedFolderId={selectedFolderId}
                selectedNoteId={selectedNoteId}
                setSelectedFolderId={setSelectedFolderId}
                setSelectedNoteId={setSelectedNoteId}
                setIsEditing={setIsEditing}
                fetcher={pageActionFetcher}
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
                searchQuery={searchQuery}
              />
            </div>
          </>
        )}
      </div>

      {/* Right Column - Editor/Viewer */}
      <div
        className={`${
          isLeftColumnCollapsed ? "w-full" : "w-2/3"
        } p-6 overflow-y-auto transition-all duration-300 ease-in-out bg-white dark:bg-gray-900`}
      >
        {isEditing ? (
          <NoteEditor
            key={selectedNote?.id || "new"}
            note={selectedNote}
            fetcher={{
              submit: pageActionFetcher.submit,
              state: pageActionFetcher.state,
              data: pageActionFetcher.data,
              titleFetcher: titleGenerationFetcher,
            }}
            onCancel={() => setIsEditing(false)}
            folderId={selectedFolderId}
            folders={folders}
          />
        ) : selectedNote ? (
          <div className="space-y-4 max-w-4xl">
            {/* Note Header */}
            <div className="flex items-start justify-between gap-4">
              <div className="flex-1 min-w-0">
                <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-100 mb-2">
                  {selectedNote.title}
                </h1>
                <div className="flex items-center gap-3 flex-wrap">
                  {selectedNote.folderId && folders.find((f: any) => f.id === selectedNote.folderId) && (
                    <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400">
                      <span className="flex items-center gap-1">
                        {folders.find((f: any) => f.id === selectedNote.folderId)?.name}
                      </span>
                    </div>
                  )}
                  {selectedNote.isEncrypted === 1 && (
                    <div className="flex items-center gap-1.5 px-2.5 py-1 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded text-xs font-medium text-green-700 dark:text-green-300">
                      <span className="w-1.5 h-1.5 bg-green-500 dark:bg-green-400 rounded-full"></span>
                      Encrypted
                    </div>
                  )}
                </div>
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setIsEditing(true)}
                  className="p-2.5 rounded-lg bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700 text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-200 transition-all duration-150 focus:outline-none focus:ring-2 focus:ring-gray-400 dark:focus:ring-gray-600"
                  aria-label="Edit note"
                  title="Edit note"
                >
                  <PencilSquareIcon className="h-5 w-5" />
                </button>
                <button
                  onClick={() => handleDelete(selectedNote.id)}
                  className="p-2.5 rounded-lg bg-gray-100 dark:bg-gray-800 hover:bg-red-50 dark:hover:bg-red-900/20 text-gray-600 dark:text-gray-400 hover:text-red-500 dark:hover:text-red-400 transition-all duration-150 focus:outline-none focus:ring-2 focus:ring-red-400 dark:focus:ring-red-600"
                  aria-label="Delete note"
                  title="Delete note"
                >
                  <TrashIcon className="h-5 w-5" />
                </button>
              </div>
            </div>

            {/* Note Content */}
            <div className="prose prose-gray dark:prose-invert prose-sm md:prose-base max-w-none bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 p-6 rounded-lg shadow-sm">
              <ReactMarkdown>{selectedNote.content}</ReactMarkdown>
            </div>
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center h-full">
            <div className="text-center space-y-3">
              <PencilSquareIcon className="h-16 w-16 text-gray-300 dark:text-gray-700 mx-auto" />
              <h2 className="text-xl font-semibold text-gray-600 dark:text-gray-400">
                Select a note to view or edit
              </h2>
              <p className="text-sm text-gray-500 dark:text-gray-500">
                Or, create a new one using the button on the left.
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
