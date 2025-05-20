import { useState, useEffect, useMemo, useRef } from "react";
import { desc, sql } from "drizzle-orm";
import { useFetcher, useLoaderData, useRevalidator } from "react-router";
import {
  PlusIcon,
  PencilSquareIcon,
  TrashIcon,
  SparklesIcon,
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
  const fetcher = useFetcher<any>();
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

  const notes = fetcher.data?.notes || initialNotes;
  const folders = fetcher.data?.folders || initialFolders;

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

  const prevFetcherStateRef = useRef(fetcher.state);
  useEffect(() => {
    const previousState = prevFetcherStateRef.current;
    if (
      fetcher.state === "idle" &&
      previousState === "loading" &&
      fetcher.data
    ) {
      const data = fetcher.data;
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
    prevFetcherStateRef.current = fetcher.state;
  }, [fetcher.state, fetcher.data, revalidator, selectedNoteId, addToast]);

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
      fetcher.submit(
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
    fetcher.submit(
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

    fetcher.submit(
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
      fetcher.submit(
        { intent: "deleteFolder", folderId: folderId.toString() },
        { method: "post", action: "/notes" }
      );
      if (selectedFolderId === folderId) {
        setSelectedFolderId(null);
      }
    }
  };

  return (
    <div className="flex h-screen bg-slate-900 text-slate-100">
      <div className="w-1/3 border-r border-slate-700 p-4 flex flex-col">
        <SearchBar searchQuery={searchQuery} setSearchQuery={setSearchQuery} />
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
          fetcher={fetcher}
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
      </div>
      <div className="w-2/3 p-6 overflow-y-auto">
        {isEditing ? (
          <NoteEditor
            key={selectedNote?.id || "new"}
            note={selectedNote}
            fetcher={fetcher}
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
