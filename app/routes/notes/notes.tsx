// Renamed and refactored from principles.tsx to notes.tsx
import { useState, useEffect, useMemo, useRef } from "react";
import { desc, sql } from "drizzle-orm";
import { useFetcher, useLoaderData, useRevalidator } from "react-router";
import {
  PlusIcon,
  MagnifyingGlassIcon,
  PencilSquareIcon,
  TrashIcon,
  FolderPlusIcon,
  FolderIcon,
} from "@heroicons/react/24/outline";
import ReactMarkdown from "react-markdown";
import {
  pageAccessLoader,
  pageAccessAction,
} from "~/modules/middleware/pageAccess";
import type { notesTable, foldersTable } from "~/db/schema";
import { fuzzyMatch } from "~/utils/fuzzyMatch";
import { useToast } from "~/hooks/useToast";

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

  return (
    <div className="flex h-screen bg-slate-900 text-slate-100">
      <div className="w-1/3 border-r border-slate-700 p-4 flex flex-col">
        <div className="mb-4">
          <div className="relative">
            <MagnifyingGlassIcon className="h-5 w-5 text-slate-400 absolute top-1/2 left-3 transform -translate-y-1/2" />
            <input
              type="text"
              placeholder="Search notes..."
              className="w-full bg-slate-800 border border-slate-600 rounded-lg p-2 pl-10 focus:ring-purple-500 focus:border-purple-500"
              value={searchQuery}
              onChange={handleSearchChange}
            />
          </div>
        </div>
        <button
          onClick={handleCreateNew}
          className="mb-2 w-full flex items-center justify-center px-4 py-2 rounded-lg bg-gradient-to-r from-purple-500 to-pink-600 text-white font-medium hover:from-purple-600 hover:to-pink-700 transition-colors"
        >
          <PlusIcon className="h-5 w-5 mr-2" />
          New Note
        </button>
        <button
          onClick={() => setShowFolderInput((v) => !v)}
          className="mb-4 w-full flex items-center justify-center px-4 py-2 rounded-lg bg-slate-700 text-white font-medium hover:bg-slate-600 transition-colors"
        >
          <FolderPlusIcon className="h-5 w-5 mr-2" />
          New Folder
        </button>
        {showFolderInput && (
          <div className="mb-4 flex">
            <input
              type="text"
              className="flex-1 bg-slate-800 border border-slate-600 rounded-l-lg p-2 focus:ring-purple-500 focus:border-purple-500"
              placeholder="Folder name"
              value={newFolderName}
              onChange={(e) => setNewFolderName(e.target.value)}
            />
            <button
              onClick={handleCreateFolder}
              className="px-3 py-2 rounded-r-lg bg-purple-600 text-white hover:bg-purple-700"
            >
              Add
            </button>
          </div>
        )}
        <div className="flex-grow overflow-y-auto space-y-2 p-1">
          <div className="mb-2">
            <button
              className={`w-full flex items-center px-3 py-2 rounded-lg transition-colors ${
                dragOverTargetId === "all"
                  ? "bg-purple-800 ring-2 ring-purple-400"
                  : selectedFolderId === null
                  ? "bg-slate-700 ring-2 ring-purple-500"
                  : "bg-slate-800 hover:bg-slate-700"
              }`}
              onClick={() => handleFolderSelect(null)}
              onDragOver={(e) => {
                e.preventDefault();
                if (draggedNoteId) setDragOverTargetId("all");
              }}
              onDragEnter={(e) => {
                e.preventDefault();
                if (draggedNoteId) setDragOverTargetId("all");
              }}
              onDragLeave={() => setDragOverTargetId(null)}
              onDrop={(e) => {
                e.preventDefault();
                if (draggedNoteId) {
                  fetcher.submit(
                    {
                      intent: "moveNoteToFolder",
                      noteId: draggedNoteId.toString(),
                      folderId: "", // Empty string for "no folder"
                    },
                    { method: "post", action: "/notes" }
                  );
                  addToast("Note removed from folder.", "success", 3000);
                  setDraggedNoteId(null);
                  setDragOverTargetId(null);
                }
              }}
            >
              <FolderIcon className="h-5 w-5 mr-2 text-slate-400" />
              All Notes
            </button>
          </div>
          {folders.map((folder: any) => (
            <div key={folder.id} className="mb-1">
              <button
                className={`w-full flex items-center px-3 py-2 rounded-lg transition-colors ${
                  dragOverTargetId === folder.id
                    ? "bg-purple-800 ring-2 ring-purple-400"
                    : selectedFolderId === folder.id
                    ? "bg-slate-700 ring-2 ring-purple-500"
                    : "bg-slate-800 hover:bg-slate-700"
                }`}
                onClick={() => handleFolderSelect(folder.id)}
                onDragOver={(e) => {
                  e.preventDefault();
                  if (draggedNoteId) setDragOverTargetId(folder.id);
                }}
                onDragEnter={(e) => {
                  e.preventDefault();
                  if (draggedNoteId) setDragOverTargetId(folder.id);
                }}
                onDragLeave={() => setDragOverTargetId(null)}
                onDrop={(e) => {
                  e.preventDefault();
                  if (draggedNoteId) {
                    fetcher.submit(
                      {
                        intent: "moveNoteToFolder",
                        noteId: draggedNoteId.toString(),
                        folderId: folder.id.toString(),
                      },
                      { method: "post", action: "/notes" }
                    );
                    addToast(
                      `Note moved to '${folder.name}'.`,
                      "success",
                      3000
                    );
                    setDraggedNoteId(null);
                    setDragOverTargetId(null);
                  }
                }}
              >
                <FolderIcon className="h-5 w-5 mr-2 text-purple-400" />
                {folder.name}
              </button>
            </div>
          ))}
          <hr className="my-2 border-slate-700" />
          {filteredNotes.length > 0 ? (
            filteredNotes.map((n: any) => {
              const currentFolder = folders.find(
                (f: any) => f.id === n.folderId
              );
              return (
                <div
                  key={n.id}
                  draggable
                  onDragStart={() => setDraggedNoteId(n.id)}
                  onClick={() => handleSelectNote(n)}
                  className={`p-3 rounded-lg cursor-grab mb-2 transition-colors
                    ${draggedNoteId === n.id ? "opacity-50 bg-purple-700" : ""}
                    ${
                      selectedNoteId === n.id
                        ? "bg-purple-600 ring-2 ring-purple-400 shadow-lg"
                        : "bg-slate-800 hover:bg-slate-700 shadow-md"
                    }
                  `}
                >
                  <h3 className="font-semibold text-slate-100 truncate">
                    {n.title || "Untitled Note"}
                  </h3>
                  <p className="text-sm text-slate-400 truncate mt-1">
                    {n.content?.substring(0, 80) || "No content..."}
                  </p>
                  {currentFolder && (
                    <div className="text-xs text-purple-300 mt-2 flex items-center">
                      <FolderIcon className="h-4 w-4 mr-1 flex-shrink-0" />
                      <span>{currentFolder.name}</span>
                    </div>
                  )}
                </div>
              );
            })
          ) : (
            <p className="text-slate-400 text-center py-4">
              {searchQuery
                ? "No notes match your search."
                : "No notes yet. Create one!"}
            </p>
          )}
        </div>
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

function NoteEditor({
  note,
  fetcher,
  onCancel,
  folderId,
  folders,
}: {
  note?: typeof notesTable.$inferSelect | null;
  fetcher: any;
  onCancel: () => void;
  folderId?: number | null;
  folders: any[];
}) {
  const [title, setTitle] = useState(note?.title || "");
  const [content, setContent] = useState(note?.content || "");
  const [selectedFolder, setSelectedFolder] = useState<number | null>(
    note?.folderId || folderId || null
  );
  const isNew = !note;
  const { addToast } = useToast();

  useEffect(() => {
    setTitle(note?.title || "");
    setContent(note?.content || "");
    setSelectedFolder(note?.folderId || folderId || null);
  }, [note, folderId]);

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    // Let fetcher.Form handle the submit, but add toast after
    setTimeout(() => {
      if (isNew) {
        addToast(`Note '${title}' created successfully!`, "success", 3000);
      } else {
        addToast(`Note '${title}' saved.`, "success", 3000);
      }
    }, 0);
  };

  return (
    <fetcher.Form
      method="post"
      action="/notes"
      className="space-y-6"
      onSubmit={handleSubmit}
    >
      <input
        type="hidden"
        name="intent"
        value={isNew ? "createNote" : "updateNote"}
      />
      {note?.id && <input type="hidden" name="noteId" value={note.id} />}
      <div>
        <label
          htmlFor="title"
          className="block text-sm font-medium text-slate-300 mb-1"
        >
          Title
        </label>
        <input
          type="text"
          name="title"
          id="title"
          required
          className="w-full bg-slate-800 border border-slate-600 rounded-lg p-3 focus:ring-purple-500 focus:border-purple-500"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="Note Title"
        />
      </div>
      <div>
        <label
          htmlFor="content"
          className="block text-sm font-medium text-slate-300 mb-1"
        >
          Content (Markdown supported)
        </label>
        <textarea
          name="content"
          id="content"
          required
          rows={12}
          className="w-full bg-slate-800 border border-slate-600 rounded-lg p-3 focus:ring-purple-500 focus:border-purple-500"
          value={content}
          onChange={(e) => setContent(e.target.value)}
          placeholder="Write your note content here..."
        />
      </div>
      <div>
        <label
          htmlFor="folderId"
          className="block text-sm font-medium text-slate-300 mb-1"
        >
          Folder
        </label>
        <select
          name="folderId"
          id="folderId"
          className="w-full bg-slate-800 border border-slate-600 rounded-lg p-3 focus:ring-purple-500 focus:border-purple-500"
          value={selectedFolder || ""}
          onChange={(e) =>
            setSelectedFolder(e.target.value ? Number(e.target.value) : null)
          }
        >
          <option value="">No Folder</option>
          {folders.map((folder: any) => (
            <option key={folder.id} value={folder.id}>
              {folder.name}
            </option>
          ))}
        </select>
      </div>
      {fetcher.data?.error && (
        <p className="text-red-500 text-sm">{fetcher.data.error}</p>
      )}
      <div className="flex justify-end space-x-3">
        <button
          type="button"
          onClick={onCancel}
          className="px-4 py-2 rounded-lg border border-slate-600 text-slate-300 hover:bg-slate-700 transition-colors"
        >
          Cancel
        </button>
        <button
          type="submit"
          disabled={fetcher.state === "submitting"}
          className="px-6 py-2 rounded-lg bg-gradient-to-r from-purple-500 to-pink-600 text-white font-medium hover:from-purple-600 hover:to-pink-700 transition-colors disabled:opacity-50"
        >
          {fetcher.state === "submitting"
            ? isNew
              ? "Creating..."
              : "Saving..."
            : isNew
            ? "Create Note"
            : "Save Changes"}
        </button>
      </div>
    </fetcher.Form>
  );
}
