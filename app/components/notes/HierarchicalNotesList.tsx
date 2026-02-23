import {
  FolderIcon,
  FolderOpenIcon,
  DocumentTextIcon,
  PencilIcon,
  TrashIcon,
  XMarkIcon,
  FolderPlusIcon,
  ChevronDownIcon,
  LockClosedIcon,
  ChevronUpDownIcon,
} from "@heroicons/react/24/outline";
import { useState, useMemo } from "react";

export function HierarchicalNotesList({
  folders,
  notes,
  selectedFolderId,
  selectedNoteId,
  setSelectedFolderId,
  setSelectedNoteId,
  setIsEditing,
  fetcher,
  addToast,
  draggedNoteId,
  setDraggedNoteId,
  dragOverTargetId,
  setDragOverTargetId,
  handleDeleteFolder,
  handleRenameFolder,
  editingFolderId,
  setEditingFolderId,
  editingFolderName,
  setEditingFolderName,
  showFolderInput,
  setShowFolderInput,
  newFolderName,
  setNewFolderName,
  handleCreateFolder,
  searchQuery,
}: any) {
  const [expandedFolders, setExpandedFolders] = useState<Set<number>>(() => {
    if (typeof window !== "undefined") {
      const saved = localStorage.getItem("expandedFolders");
      return new Set(saved ? JSON.parse(saved) : []);
    }
    return new Set();
  });

  const toggleFolderExpansion = (folderId: number) => {
    const newExpanded = new Set(expandedFolders);
    if (newExpanded.has(folderId)) {
      newExpanded.delete(folderId);
    } else {
      newExpanded.add(folderId);
    }
    setExpandedFolders(newExpanded);
    if (typeof window !== "undefined") {
      localStorage.setItem("expandedFolders", JSON.stringify(Array.from(newExpanded)));
    }
  };

  const expandAll = () => {
    const allFolderIds = new Set(folders.map((f: any) => f.id) as number[]);
    setExpandedFolders(allFolderIds);
    if (typeof window !== "undefined") {
      localStorage.setItem("expandedFolders", JSON.stringify(Array.from(allFolderIds)));
    }
  };

  const collapseAll = () => {
    setExpandedFolders(new Set());
    if (typeof window !== "undefined") {
      localStorage.setItem("expandedFolders", JSON.stringify([]));
    }
  };

  const getRelativeTime = (date: Date | string) => {
    const noteDate = typeof date === "string" ? new Date(date) : date;
    const now = new Date();
    const diffMs = now.getTime() - noteDate.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 1) return "Just now";
    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    if (diffDays < 7) return `${diffDays}d ago`;
    return noteDate.toLocaleDateString();
  };

  // Filter and sort notes
  const filteredAndSortedNotes = useMemo(() => {
    let filtered = notes;
    if (searchQuery) {
      filtered = filtered.filter(
        (n: any) =>
          n.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
          n.content.toLowerCase().includes(searchQuery.toLowerCase())
      );
    }
    return [...filtered].sort((a: any, b: any) => {
      const aDate = new Date(a.updatedAt || a.createdAt || 0).getTime();
      const bDate = new Date(b.updatedAt || b.createdAt || 0).getTime();
      return bDate - aDate;
    });
  }, [notes, searchQuery]);

  // Group notes by folder
  const notesByFolder = useMemo(() => {
    const grouped: { [key: string | number]: any[] } = {};
    folders.forEach((f: any) => {
      grouped[f.id] = filteredAndSortedNotes.filter((n: any) => n.folderId === f.id);
    });
    grouped.unfiled = filteredAndSortedNotes.filter((n: any) => !n.folderId);
    return grouped;
  }, [folders, filteredAndSortedNotes]);

  return (
    <div className="flex flex-col h-full">
      {/* Header with New Folder Button and Expand/Collapse All */}
      <div className="flex gap-2 mb-3">
        <button
          onClick={() => setShowFolderInput((v: boolean) => !v)}
          className="flex-1 flex items-center justify-center px-3 py-2 rounded-lg bg-gray-200 dark:bg-gray-700 text-gray-900 dark:text-gray-100 font-medium text-sm hover:bg-gray-300 dark:hover:bg-gray-600 focus:outline-none focus:ring-2 focus:ring-gray-400 dark:focus:ring-gray-600 transition-all duration-150 min-h-[36px]"
        >
          <FolderPlusIcon className="h-4 w-4 mr-1.5" />
          New Folder
        </button>
        <button
          onClick={expandAll}
          disabled={folders.length === 0}
          className="px-3 py-2 rounded-lg bg-gray-200 dark:bg-gray-700 text-gray-900 dark:text-gray-100 text-sm hover:bg-gray-300 dark:hover:bg-gray-600 disabled:opacity-50 disabled:cursor-not-allowed focus:outline-none focus:ring-2 focus:ring-gray-400 dark:focus:ring-gray-600 transition-all duration-150 min-h-[36px]"
          title="Expand all folders"
        >
          <ChevronDownIcon className="h-4 w-4" />
        </button>
        <button
          onClick={collapseAll}
          disabled={folders.length === 0}
          className="px-3 py-2 rounded-lg bg-gray-200 dark:bg-gray-700 text-gray-900 dark:text-gray-100 text-sm hover:bg-gray-300 dark:hover:bg-gray-600 disabled:opacity-50 disabled:cursor-not-allowed focus:outline-none focus:ring-2 focus:ring-gray-400 dark:focus:ring-gray-600 transition-all duration-150 min-h-[36px]"
          title="Collapse all folders"
        >
          <ChevronUpDownIcon className="h-4 w-4" />
        </button>
      </div>

      {/* New Folder Input */}
      {showFolderInput && (
        <div className="flex gap-2 p-2 mb-3 bg-gray-100 dark:bg-gray-750 rounded-lg border border-gray-300 dark:border-gray-600 overflow-hidden">
          <input
            type="text"
            className="flex-1 px-2.5 py-1.5 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 text-gray-900 dark:text-gray-100 rounded-md focus:ring-2 focus:ring-gray-400 dark:focus:ring-gray-600 focus:border-transparent placeholder-gray-400 dark:placeholder-gray-500 transition-all duration-150 text-sm"
            placeholder="Folder name..."
            value={newFolderName}
            onChange={(e) => setNewFolderName(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && handleCreateFolder()}
            autoFocus
          />
          <button
            onClick={handleCreateFolder}
            disabled={!newFolderName.trim()}
            className="px-2.5 py-1.5 rounded-md bg-gray-900 dark:bg-gray-800 text-white dark:text-gray-100 hover:bg-gray-800 dark:hover:bg-gray-700 disabled:opacity-50 disabled:cursor-not-allowed font-semibold transition-all duration-150 focus:outline-none focus:ring-2 focus:ring-gray-400 dark:focus:ring-gray-600 flex-shrink-0 text-sm"
          >
            Add
          </button>
        </div>
      )}

      {/* List Container */}
      <div className="flex-grow overflow-y-auto space-y-0.5 min-h-0">
        {/* All Notes Item */}
        {filteredAndSortedNotes.length > 0 && (
          <AllNotesItem
            noteCount={filteredAndSortedNotes.length}
            isSelected={selectedFolderId === null}
            onSelect={() => setSelectedFolderId(null)}
            draggedNoteId={draggedNoteId}
            dragOverTargetId={dragOverTargetId}
            setDragOverTargetId={setDragOverTargetId}
            fetcher={fetcher}
            addToast={addToast}
            setDraggedNoteId={setDraggedNoteId}
            notes={filteredAndSortedNotes}
            selectedNoteId={selectedNoteId}
            setSelectedNoteId={setSelectedNoteId}
            setIsEditing={setIsEditing}
          />
        )}

        {/* Folders with nested notes */}
        {folders.length > 0 ? (
          folders.map((folder: any) => {
            const isFolderExpanded = expandedFolders.has(folder.id);
            const folderNotes = notesByFolder[folder.id] || [];

            return (
              <div key={folder.id} className="animate-slideIn">
                {/* Folder Item */}
                <FolderItem
                  folder={folder}
                  isSelected={selectedFolderId === folder.id}
                  isExpanded={isFolderExpanded}
                  noteCount={folderNotes.length}
                  onSelect={() => setSelectedFolderId(folder.id)}
                  onToggleExpand={() => toggleFolderExpansion(folder.id)}
                  onRename={() => {
                    setEditingFolderId(folder.id);
                    setEditingFolderName(folder.name);
                  }}
                  onDelete={() => handleDeleteFolder(folder.id, folder.name)}
                  isEditing={editingFolderId === folder.id}
                  editingName={editingFolderName}
                  setEditingName={setEditingFolderName}
                  onSaveEdit={() => handleRenameFolder(folder.id)}
                  onCancelEdit={() => {
                    setEditingFolderId(null);
                    setEditingFolderName("");
                  }}
                  draggedNoteId={draggedNoteId}
                  dragOverTargetId={dragOverTargetId}
                  setDragOverTargetId={setDragOverTargetId}
                  fetcher={fetcher}
                  addToast={addToast}
                  setDraggedNoteId={setDraggedNoteId}
                />

                {/* Nested Notes (when expanded) */}
                {isFolderExpanded && folderNotes.length > 0 && (
                  <div className="space-y-0.5">
                    {folderNotes.map((note: any) => (
                      <NoteItem
                        key={note.id}
                        note={note}
                        isSelected={selectedNoteId === note.id}
                        isDragged={draggedNoteId === note.id}
                        onSelect={() => {
                          setSelectedNoteId(note.id);
                          setIsEditing(false);
                        }}
                        onDragStart={() => setDraggedNoteId(note.id)}
                        onDragEnd={() => setDraggedNoteId(null)}
                        nested={true}
                      />
                    ))}
                  </div>
                )}
              </div>
            );
          })
        ) : (
          <div className="flex items-center justify-center py-6 text-center">
            <p className="text-xs text-gray-400 dark:text-gray-500">
              No folders yet. Create one to organize your notes.
            </p>
          </div>
        )}

        {/* Unfiled Notes Section */}
        {notesByFolder.unfiled && notesByFolder.unfiled.length > 0 && (
          <div className="space-y-0.5 mt-2 pt-2 border-t border-gray-200 dark:border-gray-700">
            <div className="px-3 py-1.5 text-xs font-semibold text-gray-600 dark:text-gray-400 uppercase tracking-wide">
              Unfiled ({notesByFolder.unfiled.length})
            </div>
            {notesByFolder.unfiled.map((note: any) => (
              <NoteItem
                key={note.id}
                note={note}
                isSelected={selectedNoteId === note.id}
                isDragged={draggedNoteId === note.id}
                onSelect={() => {
                  setSelectedNoteId(note.id);
                  setIsEditing(false);
                }}
                onDragStart={() => setDraggedNoteId(note.id)}
                onDragEnd={() => setDraggedNoteId(null)}
                nested={false}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

// All Notes Item Component
function AllNotesItem({
  noteCount,
  isSelected,
  onSelect,
  draggedNoteId,
  dragOverTargetId,
  setDragOverTargetId,
  fetcher,
  addToast,
  setDraggedNoteId,
}: any) {
  return (
    <div
      className={`group w-full flex items-center justify-between px-3 py-2 rounded-lg transition-all duration-200 cursor-pointer border text-sm ${
        dragOverTargetId === "all"
          ? "bg-blue-50 dark:bg-blue-900 border-blue-400 dark:border-blue-600 ring-2 ring-blue-300 dark:ring-blue-600 shadow-md"
          : isSelected
            ? "bg-gray-100 dark:bg-gray-700 border-gray-300 dark:border-gray-600 ring-1 ring-gray-300 dark:ring-gray-600 shadow-sm"
            : "bg-white dark:bg-gray-800 border-gray-300 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-800 shadow-sm hover:shadow-md"
      }`}
      onClick={onSelect}
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
              folderId: "",
            },
            { method: "post", action: "/notes" }
          );
          addToast("Note removed from folder.", "success", 3000);
          setDraggedNoteId(null);
          setDragOverTargetId(null);
        }
      }}
      style={{
        animation: dragOverTargetId === "all" 
          ? "pulse 0.6s cubic-bezier(0.4, 0, 0.6, 1) infinite" 
          : "none"
      }}
    >
      <div className="flex items-center gap-2">
        <FolderIcon className="h-4 w-4 text-gray-500 dark:text-gray-400 flex-shrink-0" />
        <span className="text-gray-900 dark:text-gray-100 font-semibold">
          All Notes
        </span>
      </div>
      <span className="px-2 py-0.5 text-xs font-medium text-gray-600 dark:text-gray-400 bg-gray-200 dark:bg-gray-700 rounded flex-shrink-0">
        {noteCount}
      </span>
    </div>
  );
}

// Folder Item Component
function FolderItem({
  folder,
  isSelected,
  isExpanded,
  noteCount,
  onSelect,
  onToggleExpand,
  onRename,
  onDelete,
  isEditing,
  editingName,
  setEditingName,
  onSaveEdit,
  onCancelEdit,
  draggedNoteId,
  dragOverTargetId,
  setDragOverTargetId,
  fetcher,
  addToast,
  setDraggedNoteId,
}: any) {
  return (
    <div
      className={`group w-full flex items-center justify-between px-3 py-2 rounded-lg transition-all duration-200 cursor-pointer border text-sm ${
        dragOverTargetId === folder.id
          ? "bg-blue-50 dark:bg-blue-900 border-blue-400 dark:border-blue-600 ring-2 ring-blue-300 dark:ring-blue-600 shadow-md"
          : "bg-white dark:bg-gray-800 border-gray-300 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-800 shadow-sm hover:shadow-md"
      }`}
      onClick={() => !isEditing && onToggleExpand()}
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
          addToast(`Note moved to '${folder.name}'.`, "success", 3000);
          setDraggedNoteId(null);
          setDragOverTargetId(null);
        }
      }}
      style={{
        animation: dragOverTargetId === folder.id 
          ? "pulse 0.6s cubic-bezier(0.4, 0, 0.6, 1) infinite" 
          : "none"
      }}
    >
      {isEditing ? (
        // Edit Mode
        <div className="flex-1 flex items-center gap-2">
          <input
            type="text"
            value={editingName}
            onChange={(e) => setEditingName(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") {
                onSaveEdit();
              } else if (e.key === "Escape") {
                onCancelEdit();
              }
            }}
            className="flex-1 px-2 py-1 bg-white dark:bg-gray-700 border border-gray-400 dark:border-gray-600 text-gray-900 dark:text-gray-100 rounded-md text-sm focus:ring-2 focus:ring-gray-400 dark:focus:ring-gray-600 focus:border-transparent transition-all duration-150"
            autoFocus
            onBlur={() => {
              setTimeout(() => {
                if (isEditing) {
                  onSaveEdit();
                  onCancelEdit();
                }
              }, 100);
            }}
          />
          <button
            onClick={(e) => {
              e.stopPropagation();
              onSaveEdit();
            }}
            className="p-1.5 text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-200 rounded-md hover:bg-gray-200 dark:hover:bg-gray-600 transition-all duration-150 flex-shrink-0"
            title="Save"
          >
            <PencilIcon className="h-4 w-4" />
          </button>
          <button
            onClick={(e) => {
              e.stopPropagation();
              onCancelEdit();
            }}
            className="p-1.5 text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-200 rounded-md hover:bg-gray-200 dark:hover:bg-gray-600 transition-all duration-150 flex-shrink-0"
            title="Cancel"
          >
            <XMarkIcon className="h-4 w-4" />
          </button>
        </div>
      ) : (
        // View Mode
        <>
          <div className="flex items-center gap-2 flex-1 min-w-0">
            <button
              onClick={(e) => {
                e.stopPropagation();
              }}
              className="p-0.5 text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700 rounded transition-all duration-200 flex-shrink-0 pointer-events-none"
              title={isExpanded ? "Collapse folder" : "Expand folder"}
            >
              <ChevronDownIcon 
                className={`h-4 w-4 transition-transform duration-200 ${isExpanded ? 'rotate-0' : '-rotate-90'}`}
              />
            </button>
            {isExpanded ? (
              <FolderOpenIcon className="h-5 w-5 text-gray-500 dark:text-gray-400 flex-shrink-0" />
            ) : (
              <FolderIcon className="h-5 w-5 text-gray-500 dark:text-gray-400 flex-shrink-0" />
            )}
            <span
              className="text-gray-900 dark:text-gray-100 font-semibold text-sm truncate"
              title={folder.name}
            >
              {folder.name}
            </span>
          </div>

          <span className="ml-2 px-2 py-0.5 text-xs font-medium text-gray-600 dark:text-gray-400 bg-gray-200 dark:bg-gray-700 rounded flex-shrink-0">
            {noteCount}
          </span>

          <div className="flex items-center gap-1 ml-2 opacity-100 transition-opacity duration-150 flex-shrink-0">
            <button
              onClick={(e) => {
                e.stopPropagation();
                onRename();
              }}
              className="p-1.5 text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-200 rounded-md hover:bg-gray-200 dark:hover:bg-gray-600 transition-all duration-150 focus:outline-none focus:ring-2 focus:ring-gray-400 dark:focus:ring-gray-600 flex-shrink-0"
              title="Rename folder"
            >
              <PencilIcon className="h-4 w-4" />
            </button>
            <button
              onClick={(e) => {
                e.stopPropagation();
                onDelete();
              }}
              className="p-1.5 text-gray-600 dark:text-gray-400 hover:text-red-500 dark:hover:text-red-400 rounded-md hover:bg-red-50 dark:hover:bg-red-900/20 transition-all duration-150 focus:outline-none focus:ring-2 focus:ring-red-400 dark:focus:ring-red-600 flex-shrink-0"
              title="Delete folder"
            >
              <TrashIcon className="h-4 w-4" />
            </button>
          </div>
        </>
      )}
    </div>
  );
}

// Note Item Component (nested under folders)
function NoteItem({
  note,
  isSelected,
  isDragged,
  onSelect,
  onDragStart,
  onDragEnd,
  nested,
}: any) {
  const getRelativeTime = (date: Date | string) => {
    const noteDate = typeof date === "string" ? new Date(date) : date;
    const now = new Date();
    const diffMs = now.getTime() - noteDate.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 1) return "Just now";
    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    if (diffDays < 7) return `${diffDays}d ago`;
    return noteDate.toLocaleDateString();
  };

  const lastModified = getRelativeTime(note.updatedAt || note.createdAt);

  return (
    <div
      draggable
      onDragStart={onDragStart}
      onDragEnd={onDragEnd}
      onClick={onSelect}
      className={`px-3 py-2 rounded-lg cursor-grab active:cursor-grabbing transition-all duration-200 border text-sm ${
        isDragged
          ? "opacity-50 bg-gray-100 dark:bg-gray-700 border-gray-400 dark:border-gray-600"
          : isSelected
            ? "bg-gray-100 dark:bg-gray-700 border-gray-400 dark:border-gray-600 ring-1 ring-gray-400 dark:ring-gray-600 shadow-md"
            : "bg-white dark:bg-gray-800 border-gray-300 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-800 shadow-sm hover:shadow-md"
      } ${nested ? "ml-5" : ""}`}
      role="option"
      aria-selected={isSelected}
    >
      <div className="flex items-center justify-between gap-2">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <DocumentTextIcon className="h-3.5 w-3.5 text-gray-400 dark:text-gray-500 flex-shrink-0" />
            <h3 className="font-medium text-gray-900 dark:text-gray-100 truncate">
              {note.title || "Untitled Note"}
            </h3>
          </div>
          <p className="text-xs text-gray-500 dark:text-gray-400 truncate mt-1 ml-5">
            {note.content?.substring(0, 50) || "No content..."}
          </p>
        </div>
        <div className="flex items-center gap-2 flex-shrink-0">
          {note.isEncrypted === 1 && (
            <LockClosedIcon className="h-3 w-3 text-green-600 dark:text-green-400 flex-shrink-0" />
          )}
          <span className="text-xs text-gray-500 dark:text-gray-500 whitespace-nowrap">
            {lastModified}
          </span>
        </div>
      </div>
    </div>
  );
}
