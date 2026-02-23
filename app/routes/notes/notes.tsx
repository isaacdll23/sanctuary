import { useEffect, useMemo, useRef, useState } from "react";
import { useFetcher, useLoaderData, useRevalidator } from "react-router";
import {
  ArrowLeftIcon,
  DocumentDuplicateIcon,
  FolderPlusIcon,
  LockClosedIcon,
  PencilSquareIcon,
  PlusIcon,
  TrashIcon,
  XMarkIcon,
} from "@heroicons/react/24/outline";
import ReactMarkdown from "react-markdown";
import { pageAccessAction, pageAccessLoader } from "~/modules/middleware/pageAccess";
import type { foldersTable, notesTable } from "~/db/schema";
import { fuzzyMatch } from "~/utils/fuzzyMatch";
import { useToast } from "~/hooks/useToast";
import { NoteEditor } from "~/components/notes/NoteEditor";
import { SearchBar } from "~/components/notes/SearchBar";

export function meta() {
  return [{ title: "Notes" }];
}

export const loader = pageAccessLoader("notes", async (user, request) => {
  const { getNotes, getFolders } = await import("~/modules/services/NoteService");
  const url = new URL(request.url);
  const searchTerm = url.searchParams.get("q") || "";

  const notes = await getNotes(user.id);
  const folders = await getFolders(user.id);

  return { notes, folders, searchTerm };
});

export const action = pageAccessAction("notes", async (_user, request) => {
  const { handleNoteAction } = await import("~/modules/services/NoteService");
  return handleNoteAction(request);
});

type Note = typeof notesTable.$inferSelect;
type Folder = typeof foldersTable.$inferSelect;
type ListFilter = "all" | "recent" | "encrypted" | "unfiled";
type MobilePane = "navigator" | "workspace";

function cn(...values: Array<string | false | null | undefined>) {
  return values.filter(Boolean).join(" ");
}

function getNoteTimestamp(note: Note) {
  return note.updatedAt || note.createdAt;
}

function isRecentNote(note: Note) {
  const timestamp = getNoteTimestamp(note);
  if (!timestamp) return false;
  const date = new Date(timestamp).getTime();
  if (Number.isNaN(date)) return false;
  const sevenDaysMs = 7 * 24 * 60 * 60 * 1000;
  return Date.now() - date <= sevenDaysMs;
}

function formatRelativeTime(dateInput: Date | string | null | undefined) {
  if (!dateInput) return "Unknown";
  const date = new Date(dateInput);
  if (Number.isNaN(date.getTime())) return "Unknown";

  const diffMs = Date.now() - date.getTime();
  const diffMinutes = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMs / 3600000);
  const diffDays = Math.floor(diffMs / 86400000);

  if (diffMinutes < 1) return "Just now";
  if (diffMinutes < 60) return `${diffMinutes}m ago`;
  if (diffHours < 24) return `${diffHours}h ago`;
  if (diffDays < 7) return `${diffDays}d ago`;

  return date.toLocaleDateString();
}

function getSnippet(content: string, maxLength = 100) {
  if (!content) return "No content yet.";
  const normalized = content.replace(/\s+/g, " ").trim();
  if (normalized.length <= maxLength) return normalized;
  return `${normalized.slice(0, maxLength)}...`;
}

export default function NotesPage() {
  const {
    notes: initialNotes,
    folders: initialFolders,
    searchTerm: initialSearchTerm,
  } = useLoaderData<typeof loader>();
  const noteMutationFetcher = useFetcher<typeof action>();
  const navMutationFetcher = useFetcher<typeof action>();
  const titleGenerationFetcher = useFetcher<typeof action>();
  const revalidator = useRevalidator();
  const { addToast } = useToast();

  const [searchQuery, setSearchQuery] = useState(initialSearchTerm);
  const [selectedNoteId, setSelectedNoteId] = useState<number | null>(null);
  const [selectedFolderId, setSelectedFolderId] = useState<number | null>(null);
  const [activeFilter, setActiveFilter] = useState<ListFilter>("all");
  const [isEditing, setIsEditing] = useState(false);
  const [showNewFolderInput, setShowNewFolderInput] = useState(false);
  const [newFolderName, setNewFolderName] = useState("");
  const [editingFolderId, setEditingFolderId] = useState<number | null>(null);
  const [editingFolderName, setEditingFolderName] = useState("");

  const [isMobileViewport, setIsMobileViewport] = useState(() => {
    if (typeof window === "undefined") return false;
    return window.matchMedia("(max-width: 1023px)").matches;
  });
  const [mobilePane, setMobilePane] = useState<MobilePane>("navigator");
  const pendingNavToastRef = useRef<string | null>(null);

  const notes = initialNotes;
  const folders = initialFolders;

  const folderNameById = useMemo(() => {
    const map = new Map<number, string>();
    for (const folder of folders) {
      map.set(folder.id, folder.name);
    }
    return map;
  }, [folders]);

  const sortedNotes = useMemo(() => {
    return [...notes].sort((a, b) => {
      const aDate = new Date(getNoteTimestamp(a) || 0).getTime();
      const bDate = new Date(getNoteTimestamp(b) || 0).getTime();
      return bDate - aDate;
    });
  }, [notes]);

  const filteredNotes = useMemo(() => {
    let items = sortedNotes;

    if (selectedFolderId !== null) {
      items = items.filter((note) => note.folderId === selectedFolderId);
    }

    if (activeFilter === "recent") {
      items = items.filter((note) => isRecentNote(note));
    } else if (activeFilter === "encrypted") {
      items = items.filter((note) => note.isEncrypted === 1);
    } else if (activeFilter === "unfiled") {
      items = items.filter((note) => !note.folderId);
    }

    if (searchQuery.trim()) {
      const query = searchQuery.trim();
      items = items.filter(
        (note) => fuzzyMatch(note.title, query) || fuzzyMatch(note.content, query)
      );
    }

    return items;
  }, [sortedNotes, selectedFolderId, activeFilter, searchQuery]);

  const selectedNote = useMemo(() => {
    if (selectedNoteId === null) return null;
    return notes.find((note) => note.id === selectedNoteId) || null;
  }, [notes, selectedNoteId]);

  const folderCounts = useMemo(() => {
    const counts = new Map<number, number>();
    for (const folder of folders) {
      counts.set(
        folder.id,
        notes.filter((note) => note.folderId === folder.id).length
      );
    }
    return counts;
  }, [folders, notes]);

  const filterCounts = useMemo(
    () => ({
      all: notes.length,
      recent: notes.filter((note) => isRecentNote(note)).length,
      encrypted: notes.filter((note) => note.isEncrypted === 1).length,
      unfiled: notes.filter((note) => !note.folderId).length,
    }),
    [notes]
  );

  useEffect(() => {
    if (selectedNoteId !== null && !notes.some((note) => note.id === selectedNoteId)) {
      setSelectedNoteId(null);
      setIsEditing(false);
    }
  }, [notes, selectedNoteId]);

  useEffect(() => {
    if (typeof window === "undefined") return;
    const mediaQuery = window.matchMedia("(max-width: 1023px)");

    const handleChange = (event: MediaQueryListEvent) => {
      setIsMobileViewport(event.matches);
      if (!event.matches) {
        setMobilePane("workspace");
      }
    };

    setIsMobileViewport(mediaQuery.matches);
    if (!mediaQuery.matches) {
      setMobilePane("workspace");
    }

    mediaQuery.addEventListener("change", handleChange);
    return () => mediaQuery.removeEventListener("change", handleChange);
  }, []);

  const prevNoteFetcherStateRef = useRef(noteMutationFetcher.state);
  useEffect(() => {
    const previousState = prevNoteFetcherStateRef.current;

    if (
      previousState !== "idle" &&
      noteMutationFetcher.state === "idle" &&
      noteMutationFetcher.data
    ) {
      const data = noteMutationFetcher.data as any;

      if (data.success) {
        if (data.note?.id) {
          setSelectedNoteId(data.note.id);
        }
        revalidator.revalidate();
      } else if (data.error) {
        addToast(data.error, "error", 5000);
      }
    }

    prevNoteFetcherStateRef.current = noteMutationFetcher.state;
  }, [noteMutationFetcher.state, noteMutationFetcher.data, revalidator, addToast]);

  const prevNavFetcherStateRef = useRef(navMutationFetcher.state);
  useEffect(() => {
    const previousState = prevNavFetcherStateRef.current;

    if (
      previousState !== "idle" &&
      navMutationFetcher.state === "idle" &&
      navMutationFetcher.data
    ) {
      const data = navMutationFetcher.data as any;

      if (data.success) {
        if (pendingNavToastRef.current) {
          addToast(pendingNavToastRef.current, "success", 2500);
        }
        pendingNavToastRef.current = null;
        revalidator.revalidate();
      } else if (data.error) {
        pendingNavToastRef.current = null;
        addToast(data.error, "error", 5000);
      }
    }

    prevNavFetcherStateRef.current = navMutationFetcher.state;
  }, [navMutationFetcher.state, navMutationFetcher.data, revalidator, addToast]);

  const handleCreateNote = () => {
    setSelectedNoteId(null);
    setIsEditing(true);
    if (isMobileViewport) {
      setMobilePane("workspace");
    }
  };

  const handleSelectNote = (noteId: number) => {
    setSelectedNoteId(noteId);
    setIsEditing(false);
    if (isMobileViewport) {
      setMobilePane("workspace");
    }
  };

  const handleDeleteNote = (noteId: number) => {
    const note = notes.find((item) => item.id === noteId);
    if (!note) return;

    const confirmed = window.confirm(`Delete note \"${note.title}\"?`);
    if (!confirmed) return;

    navMutationFetcher.submit(
      { intent: "deleteNote", noteId: String(noteId) },
      { method: "post", action: "/notes" }
    );
    pendingNavToastRef.current = "Note deleted.";

    if (selectedNoteId === noteId) {
      setSelectedNoteId(null);
      setIsEditing(false);
    }
  };

  const handleCopyContent = async (content: string) => {
    try {
      await navigator.clipboard.writeText(content);
      addToast("Copied to clipboard.", "success", 2500);
    } catch {
      addToast("Unable to copy note content.", "error", 3000);
    }
  };

  const handleCreateFolder = () => {
    const trimmed = newFolderName.trim();
    if (!trimmed) return;

    navMutationFetcher.submit(
      { intent: "createFolder", name: trimmed },
      { method: "post", action: "/notes" }
    );
    pendingNavToastRef.current = `Folder \"${trimmed}\" created.`;

    setNewFolderName("");
    setShowNewFolderInput(false);
  };

  const handleBeginRenameFolder = (folder: Folder) => {
    setEditingFolderId(folder.id);
    setEditingFolderName(folder.name);
  };

  const handleRenameFolder = (folder: Folder) => {
    const trimmed = editingFolderName.trim();
    if (!trimmed) {
      addToast("Folder name cannot be empty.", "error", 3000);
      return;
    }

    if (trimmed === folder.name) {
      setEditingFolderId(null);
      setEditingFolderName("");
      return;
    }

    navMutationFetcher.submit(
      {
        intent: "renameFolder",
        folderId: String(folder.id),
        name: trimmed,
      },
      { method: "post", action: "/notes" }
    );
    pendingNavToastRef.current = `Folder renamed to \"${trimmed}\".`;

    setEditingFolderId(null);
    setEditingFolderName("");
  };

  const handleDeleteFolder = (folder: Folder) => {
    const confirmed = window.confirm(
      `Delete folder \"${folder.name}\"? Notes will move to unfiled.`
    );
    if (!confirmed) return;

    navMutationFetcher.submit(
      { intent: "deleteFolder", folderId: String(folder.id) },
      { method: "post", action: "/notes" }
    );
    pendingNavToastRef.current = `Folder \"${folder.name}\" deleted.`;

    if (selectedFolderId === folder.id) {
      setSelectedFolderId(null);
    }
  };

  const workspaceSubtitle = selectedNote
    ? `${folderNameById.get(selectedNote.folderId || -1) || "No folder"} · ${formatRelativeTime(
        getNoteTimestamp(selectedNote)
      )}`
    : "Pick a note or create a new one";

  const isNavigatorVisible = !isMobileViewport || mobilePane === "navigator";
  const isWorkspaceVisible = !isMobileViewport || mobilePane === "workspace";

  return (
    <div className="flex min-h-screen h-full overflow-hidden bg-transparent text-gray-100">
      <div className="flex w-full min-h-0 flex-col">
        <header className="border-b border-gray-800 px-4 py-3 dark:border-gray-700 md:px-6">
          <div className="flex items-center justify-between gap-4">
            <div className="min-w-0">
              <h1 className="text-lg font-semibold tracking-tight md:text-xl">Notes Workspace</h1>
              <p className="truncate text-xs text-gray-300 dark:text-gray-400 md:text-sm">
                {isEditing ? "Editing note" : workspaceSubtitle}
              </p>
            </div>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={handleCreateNote}
                className="inline-flex items-center gap-1.5 rounded-lg bg-gray-900 px-3 py-2 text-sm font-medium text-white transition-colors hover:bg-gray-800 focus:outline-none focus:ring-2 focus:ring-gray-400 dark:bg-gray-800 dark:text-gray-100 dark:hover:bg-gray-700"
              >
                <PlusIcon className="h-4 w-4" />
                New Note
              </button>

              {isMobileViewport && (
                <div className="inline-flex rounded-lg border border-gray-700 p-0.5 dark:border-gray-600">
                  <button
                    type="button"
                    onClick={() => setMobilePane("navigator")}
                    className={cn(
                      "rounded-md px-2.5 py-1.5 text-xs font-medium transition-colors",
                      mobilePane === "navigator"
                        ? "bg-gray-900 text-white dark:bg-gray-800 dark:text-gray-100"
                        : "text-gray-300 hover:bg-gray-800 dark:text-gray-300 dark:hover:bg-gray-800"
                    )}
                  >
                    Browse
                  </button>
                  <button
                    type="button"
                    onClick={() => setMobilePane("workspace")}
                    className={cn(
                      "rounded-md px-2.5 py-1.5 text-xs font-medium transition-colors",
                      mobilePane === "workspace"
                        ? "bg-gray-900 text-white dark:bg-gray-800 dark:text-gray-100"
                        : "text-gray-300 hover:bg-gray-800 dark:text-gray-300 dark:hover:bg-gray-800"
                    )}
                  >
                    Workspace
                  </button>
                </div>
              )}
            </div>
          </div>
        </header>

        <div className="flex min-h-0 flex-1">
          <aside
            className={cn(
              "min-h-0 border-r border-gray-800 bg-gray-900 dark:border-gray-700 dark:bg-gray-800",
              isNavigatorVisible ? "flex w-full lg:w-[360px]" : "hidden",
              !isMobileViewport && "w-[360px]"
            )}
          >
            <div className="flex min-h-0 w-full flex-col gap-4 p-4">
              <SearchBar searchQuery={searchQuery} setSearchQuery={setSearchQuery} />

              <div className="flex flex-wrap gap-2">
                {([
                  ["all", "All"],
                  ["recent", "Recent"],
                  ["encrypted", "Encrypted"],
                  ["unfiled", "Unfiled"],
                ] as const).map(([key, label]) => {
                  const typedKey = key as ListFilter;
                  return (
                    <button
                      key={key}
                      type="button"
                      onClick={() => setActiveFilter(typedKey)}
                      className={cn(
                        "inline-flex items-center gap-1 rounded-md border px-2.5 py-1.5 text-xs font-medium transition-colors",
                        activeFilter === typedKey
                          ? "border-gray-900 bg-gray-900 text-white dark:border-gray-700 dark:bg-gray-800 dark:text-gray-100"
                          : "border-gray-700 bg-gray-900 text-gray-200 hover:bg-gray-800 dark:border-gray-600 dark:bg-gray-800 dark:text-gray-300 dark:hover:bg-gray-700"
                      )}
                    >
                      <span>{label}</span>
                      <span className="opacity-75">{filterCounts[typedKey]}</span>
                    </button>
                  );
                })}
              </div>

              <section className="rounded-xl border border-gray-800 bg-gray-900 dark:border-gray-700 dark:bg-gray-900">
                <div className="flex items-center justify-between border-b border-gray-800 px-3 py-2 dark:border-gray-700">
                  <h2 className="text-xs font-semibold uppercase tracking-wider text-gray-300 dark:text-gray-400">
                    Folders
                  </h2>
                  <button
                    type="button"
                    onClick={() => setShowNewFolderInput((value) => !value)}
                    className="inline-flex items-center gap-1 rounded-md px-2 py-1 text-xs font-medium text-gray-200 hover:bg-gray-800 focus:outline-none focus:ring-2 focus:ring-gray-400 dark:text-gray-300 dark:hover:bg-gray-800"
                  >
                    <FolderPlusIcon className="h-4 w-4" />
                    Folder
                  </button>
                </div>

                {showNewFolderInput && (
                  <div className="flex items-center gap-2 border-b border-gray-800 px-3 py-2 dark:border-gray-700">
                    <input
                      type="text"
                      value={newFolderName}
                      onChange={(event) => setNewFolderName(event.target.value)}
                      onKeyDown={(event) => {
                        if (event.key === "Enter") {
                          handleCreateFolder();
                        }
                      }}
                      placeholder="Folder name"
                      className="w-full rounded-md border border-gray-700 bg-gray-900 px-2.5 py-1.5 text-sm text-gray-100 focus:border-transparent focus:outline-none focus:ring-2 focus:ring-gray-400 dark:border-gray-600 dark:bg-gray-800 dark:text-gray-100"
                    />
                    <button
                      type="button"
                      onClick={handleCreateFolder}
                      disabled={!newFolderName.trim()}
                      className="rounded-md bg-gray-900 px-2.5 py-1.5 text-xs font-medium text-white hover:bg-gray-800 disabled:cursor-not-allowed disabled:opacity-50 dark:bg-gray-800 dark:text-gray-100 dark:hover:bg-gray-700"
                    >
                      Add
                    </button>
                  </div>
                )}

                <div className="max-h-52 overflow-y-auto p-2">
                  <button
                    type="button"
                    onClick={() => setSelectedFolderId(null)}
                    className={cn(
                      "mb-1 flex w-full items-center justify-between rounded-md px-2.5 py-2 text-left text-sm transition-colors",
                      selectedFolderId === null
                        ? "bg-gray-900 text-white dark:bg-gray-800 dark:text-gray-100"
                        : "text-gray-200 hover:bg-gray-800 dark:text-gray-300 dark:hover:bg-gray-800"
                    )}
                  >
                    <span>All folders</span>
                    <span className="text-xs opacity-80">{notes.length}</span>
                  </button>

                  {folders.length === 0 ? (
                    <p className="px-2.5 py-2 text-xs text-gray-500 dark:text-gray-400">
                      No folders yet.
                    </p>
                  ) : (
                    folders.map((folder) => {
                      const noteCount = folderCounts.get(folder.id) || 0;
                      const isEditingFolder = editingFolderId === folder.id;

                      return (
                        <div key={folder.id} className="mb-1 rounded-md border border-transparent hover:border-gray-800 dark:hover:border-gray-700">
                          {isEditingFolder ? (
                            <div className="flex items-center gap-2 px-2 py-1.5">
                              <input
                                value={editingFolderName}
                                onChange={(event) => setEditingFolderName(event.target.value)}
                                onKeyDown={(event) => {
                                  if (event.key === "Enter") {
                                    handleRenameFolder(folder);
                                  }
                                  if (event.key === "Escape") {
                                    setEditingFolderId(null);
                                    setEditingFolderName("");
                                  }
                                }}
                                className="w-full rounded-md border border-gray-700 bg-gray-900 px-2 py-1 text-sm text-gray-100 focus:border-transparent focus:outline-none focus:ring-2 focus:ring-gray-400 dark:border-gray-600 dark:bg-gray-800 dark:text-gray-100"
                                autoFocus
                              />
                              <button
                                type="button"
                                onClick={() => handleRenameFolder(folder)}
                                className="rounded-md p-1 text-gray-300 hover:bg-gray-800 hover:text-gray-100 dark:text-gray-400 dark:hover:bg-gray-700 dark:hover:text-gray-100"
                                aria-label="Save folder name"
                              >
                                <PlusIcon className="h-4 w-4 rotate-45" />
                              </button>
                              <button
                                type="button"
                                onClick={() => {
                                  setEditingFolderId(null);
                                  setEditingFolderName("");
                                }}
                                className="rounded-md p-1 text-gray-300 hover:bg-gray-800 hover:text-gray-100 dark:text-gray-400 dark:hover:bg-gray-700 dark:hover:text-gray-100"
                                aria-label="Cancel folder rename"
                              >
                                <XMarkIcon className="h-4 w-4" />
                              </button>
                            </div>
                          ) : (
                            <div className="flex items-center gap-1">
                              <button
                                type="button"
                                onClick={() => setSelectedFolderId(folder.id)}
                                className={cn(
                                  "flex w-full items-center justify-between rounded-md px-2.5 py-2 text-left text-sm transition-colors",
                                  selectedFolderId === folder.id
                                    ? "bg-gray-900 text-white dark:bg-gray-800 dark:text-gray-100"
                                    : "text-gray-200 hover:bg-gray-800 dark:text-gray-300 dark:hover:bg-gray-800"
                                )}
                              >
                                <span className="truncate">{folder.name}</span>
                                <span className="text-xs opacity-80">{noteCount}</span>
                              </button>

                              <button
                                type="button"
                                onClick={() => handleBeginRenameFolder(folder)}
                                className="rounded-md p-1.5 text-gray-500 hover:bg-gray-800 hover:text-gray-100 focus:outline-none focus:ring-2 focus:ring-gray-400 dark:text-gray-400 dark:hover:bg-gray-800 dark:hover:text-gray-100"
                                aria-label={`Rename ${folder.name}`}
                                title="Rename folder"
                              >
                                <PencilSquareIcon className="h-4 w-4" />
                              </button>
                              <button
                                type="button"
                                onClick={() => handleDeleteFolder(folder)}
                                className="rounded-md p-1.5 text-gray-500 hover:bg-red-50 hover:text-red-600 focus:outline-none focus:ring-2 focus:ring-red-400 dark:text-gray-400 dark:hover:bg-red-900/20 dark:hover:text-red-400"
                                aria-label={`Delete ${folder.name}`}
                                title="Delete folder"
                              >
                                <TrashIcon className="h-4 w-4" />
                              </button>
                            </div>
                          )}
                        </div>
                      );
                    })
                  )}
                </div>
              </section>

              <section className="min-h-0 flex-1 overflow-hidden rounded-xl border border-gray-800 bg-gray-900 dark:border-gray-700 dark:bg-gray-900">
                <div className="border-b border-gray-800 px-3 py-2 dark:border-gray-700">
                  <h2 className="text-xs font-semibold uppercase tracking-wider text-gray-300 dark:text-gray-400">
                    Notes ({filteredNotes.length})
                  </h2>
                </div>

                <div className="h-full overflow-y-auto p-2">
                  {filteredNotes.length === 0 ? (
                    <div className="flex h-full items-center justify-center px-4 py-8 text-center">
                      <div>
                        <p className="text-sm font-medium text-gray-300 dark:text-gray-300">No matching notes</p>
                        <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
                          Try another filter or create a new note.
                        </p>
                      </div>
                    </div>
                  ) : (
                    <ul className="space-y-1" role="listbox" aria-label="Notes">
                      {filteredNotes.map((note) => {
                        const isSelected = selectedNoteId === note.id;
                        const folderName = note.folderId
                          ? folderNameById.get(note.folderId)
                          : null;

                        return (
                          <li key={note.id}>
                            <button
                              type="button"
                              onClick={() => handleSelectNote(note.id)}
                              className={cn(
                                "w-full rounded-lg border px-3 py-2.5 text-left transition-colors",
                                isSelected
                                  ? "border-gray-900 bg-gray-900 text-white shadow-sm dark:border-gray-700 dark:bg-gray-800 dark:text-gray-100"
                                  : "border-gray-800 bg-gray-900 text-gray-100 hover:bg-gray-900 dark:border-gray-700 dark:bg-gray-900 dark:text-gray-100 dark:hover:bg-gray-800"
                              )}
                              role="option"
                              aria-selected={isSelected}
                            >
                              <div className="flex items-start justify-between gap-2">
                                <div className="min-w-0 flex-1">
                                  <p className="truncate text-sm font-semibold">{note.title || "Untitled note"}</p>
                                  <p
                                    className={cn(
                                      "mt-1 line-clamp-2 text-xs",
                                      isSelected
                                        ? "text-gray-100/90 dark:text-gray-100/80"
                                        : "text-gray-300 dark:text-gray-400"
                                    )}
                                  >
                                    {getSnippet(note.content, 90)}
                                  </p>
                                </div>
                              </div>

                              <div className="mt-2 flex items-center gap-2 text-[11px]">
                                {folderName ? (
                                  <span
                                    className={cn(
                                      "rounded px-1.5 py-0.5",
                                      isSelected
                                        ? "bg-gray-900/20 text-white dark:bg-gray-900/15 dark:text-gray-100"
                                        : "bg-gray-100 text-gray-300 dark:bg-gray-800 dark:text-gray-400"
                                    )}
                                  >
                                    {folderName}
                                  </span>
                                ) : (
                                  <span
                                    className={cn(
                                      "rounded px-1.5 py-0.5",
                                      isSelected
                                        ? "bg-gray-900/20 text-white dark:bg-gray-900/15 dark:text-gray-100"
                                        : "bg-gray-100 text-gray-500 dark:bg-gray-800 dark:text-gray-500"
                                    )}
                                  >
                                    Unfiled
                                  </span>
                                )}

                                {note.isEncrypted === 1 && (
                                  <span className="inline-flex items-center gap-1 text-green-700 dark:text-green-400">
                                    <LockClosedIcon className="h-3 w-3" />
                                    Encrypted
                                  </span>
                                )}

                                <span
                                  className={cn(
                                    "ml-auto",
                                    isSelected
                                      ? "text-gray-100/85 dark:text-gray-100/70"
                                      : "text-gray-500 dark:text-gray-500"
                                  )}
                                >
                                  {formatRelativeTime(getNoteTimestamp(note))}
                                </span>
                              </div>
                            </button>
                          </li>
                        );
                      })}
                    </ul>
                  )}
                </div>
              </section>
            </div>
          </aside>

          <section className={cn("min-h-0 flex-1", isWorkspaceVisible ? "flex" : "hidden")}>
            <div className="flex min-h-0 w-full flex-col bg-gray-900 dark:bg-gray-900">
              {isMobileViewport && (
                <div className="border-b border-gray-800 px-4 py-2 dark:border-gray-700">
                  <button
                    type="button"
                    onClick={() => setMobilePane("navigator")}
                    className="inline-flex items-center gap-1.5 rounded-md px-2.5 py-1.5 text-xs font-medium text-gray-200 hover:bg-gray-800 focus:outline-none focus:ring-2 focus:ring-gray-400 dark:text-gray-300 dark:hover:bg-gray-800"
                  >
                    <ArrowLeftIcon className="h-4 w-4" />
                    Back To Notes
                  </button>
                </div>
              )}

              <div className="min-h-0 flex-1 overflow-y-auto p-4 md:p-6">
                {isEditing ? (
                  <NoteEditor
                    key={selectedNote?.id || "new"}
                    note={selectedNote}
                    fetcher={{
                      submit: noteMutationFetcher.submit,
                      state: noteMutationFetcher.state,
                      data: noteMutationFetcher.data,
                      titleFetcher: titleGenerationFetcher,
                    }}
                    onCancel={() => setIsEditing(false)}
                    folderId={selectedFolderId}
                    folders={folders}
                  />
                ) : selectedNote ? (
                  <div className="mx-auto max-w-5xl">
                    <div className="rounded-2xl border border-gray-800 bg-gray-900 p-5 shadow-sm dark:border-gray-700 dark:bg-gray-800 md:p-6">
                      <div className="flex items-start justify-between gap-4">
                        <div className="min-w-0 flex-1">
                          <h2 className="truncate text-2xl font-bold tracking-tight text-gray-100 dark:text-gray-100 md:text-3xl">
                            {selectedNote.title}
                          </h2>
                          <div className="mt-2 flex flex-wrap items-center gap-2 text-xs text-gray-300 dark:text-gray-400">
                            <span className="rounded bg-gray-100 px-2 py-1 dark:bg-gray-700">
                              {selectedNote.folderId
                                ? folderNameById.get(selectedNote.folderId) || "Unknown folder"
                                : "No folder"}
                            </span>
                            <span className="rounded bg-gray-100 px-2 py-1 dark:bg-gray-700">
                              Updated {formatRelativeTime(getNoteTimestamp(selectedNote))}
                            </span>
                            {selectedNote.isEncrypted === 1 && (
                              <span className="inline-flex items-center gap-1 rounded bg-green-50 px-2 py-1 text-green-700 dark:bg-green-900/20 dark:text-green-300">
                                <LockClosedIcon className="h-3 w-3" />
                                Encrypted
                              </span>
                            )}
                          </div>
                        </div>

                        <div className="flex items-center gap-2">
                          <button
                            type="button"
                            onClick={() => handleCopyContent(selectedNote.content)}
                            className="rounded-lg border border-gray-700 bg-gray-900 p-2.5 text-gray-300 transition-colors hover:bg-gray-800 hover:text-gray-100 focus:outline-none focus:ring-2 focus:ring-gray-400 dark:border-gray-600 dark:bg-gray-900 dark:text-gray-400 dark:hover:bg-gray-700 dark:hover:text-gray-200"
                            aria-label="Copy note content"
                            title="Copy"
                          >
                            <DocumentDuplicateIcon className="h-5 w-5" />
                          </button>
                          <button
                            type="button"
                            onClick={() => setIsEditing(true)}
                            className="rounded-lg border border-gray-700 bg-gray-900 p-2.5 text-gray-300 transition-colors hover:bg-gray-800 hover:text-gray-100 focus:outline-none focus:ring-2 focus:ring-gray-400 dark:border-gray-600 dark:bg-gray-900 dark:text-gray-400 dark:hover:bg-gray-700 dark:hover:text-gray-200"
                            aria-label="Edit note"
                            title="Edit"
                          >
                            <PencilSquareIcon className="h-5 w-5" />
                          </button>
                          <button
                            type="button"
                            onClick={() => handleDeleteNote(selectedNote.id)}
                            className="rounded-lg border border-gray-700 bg-gray-900 p-2.5 text-gray-300 transition-colors hover:bg-red-50 hover:text-red-600 focus:outline-none focus:ring-2 focus:ring-red-400 dark:border-gray-600 dark:bg-gray-900 dark:text-gray-400 dark:hover:bg-red-900/20 dark:hover:text-red-400"
                            aria-label="Delete note"
                            title="Delete"
                          >
                            <TrashIcon className="h-5 w-5" />
                          </button>
                        </div>
                      </div>
                    </div>

                    <article className="prose prose-gray mt-4 max-w-none rounded-2xl border border-gray-800 bg-gray-900 p-5 shadow-sm dark:prose-invert dark:border-gray-700 dark:bg-gray-800 md:p-6">
                      <ReactMarkdown>{selectedNote.content}</ReactMarkdown>
                    </article>
                  </div>
                ) : (
                  <div className="flex h-full items-center justify-center">
                    <div className="max-w-sm text-center">
                      <PencilSquareIcon className="mx-auto h-12 w-12 text-gray-300 dark:text-gray-200" />
                      <h2 className="mt-3 text-lg font-semibold text-gray-200 dark:text-gray-300">
                        Select a note to begin
                      </h2>
                      <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
                        Browse notes on the left, or start a new note.
                      </p>
                      <button
                        type="button"
                        onClick={handleCreateNote}
                        className="mt-4 inline-flex items-center gap-2 rounded-lg bg-gray-900 px-3.5 py-2 text-sm font-medium text-white hover:bg-gray-800 focus:outline-none focus:ring-2 focus:ring-gray-400 dark:bg-gray-800 dark:text-gray-100 dark:hover:bg-gray-700"
                      >
                        <PlusIcon className="h-4 w-4" />
                        Create Note
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </section>
        </div>
      </div>
    </div>
  );
}
