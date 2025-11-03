import { FolderIcon, LockClosedIcon } from "@heroicons/react/24/outline";
import { useMemo } from "react";

export function NoteList({
  notes,
  folders,
  filteredNotes,
  selectedNoteId,
  setSelectedNoteId,
  setIsEditing,
  setDraggedNoteId,
  draggedNoteId,
  searchQuery,
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

  const sortedNotes = useMemo(() => {
    return [...filteredNotes].sort((a: any, b: any) => {
      const aDate = new Date(a.updatedAt || a.createdAt || 0).getTime();
      const bDate = new Date(b.updatedAt || b.createdAt || 0).getTime();
      return bDate - aDate;
    });
  }, [filteredNotes]);
  return (
    <div className="flex-grow overflow-y-auto space-y-2 overflow-x-hidden">
      {sortedNotes.length > 0 ? (
        sortedNotes.map((n: any) => {
          const currentFolder = folders.find((f: any) => f.id === n.folderId);
          const isSelected = selectedNoteId === n.id;
          const isDragged = draggedNoteId === n.id;
          const lastModified = getRelativeTime(n.updatedAt || n.createdAt);

          return (
            <div
              key={n.id}
              draggable
              onDragStart={() => setDraggedNoteId(n.id)}
              onDragEnd={() => setDraggedNoteId(null)}
              onClick={() => {
                setSelectedNoteId(n.id);
                setIsEditing(false);
              }}
              className={`p-3 rounded-lg cursor-grab active:cursor-grabbing transition-all duration-200 border group ${
                isDragged
                  ? "opacity-50 bg-gray-100 dark:bg-gray-700 border-gray-400 dark:border-gray-600"
                  : isSelected
                    ? "bg-gray-100 dark:bg-gray-700 border-gray-400 dark:border-gray-600 ring-1 ring-gray-400 dark:ring-gray-600 shadow-md"
                    : "bg-white dark:bg-gray-800 border-gray-300 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-800 shadow-sm hover:shadow-md"
              }`}
              role="option"
              aria-selected={isSelected}
              style={{
                animation: isDragged ? "none" : "slideIn 0.3s ease-out"
              }}
            >
              <div className="flex items-start justify-between gap-2">
                <div className="flex-1 min-w-0">
                  <h3 className="font-semibold text-sm text-gray-900 dark:text-gray-100 truncate">
                    {n.title || "Untitled Note"}
                  </h3>
                  <p className="text-xs text-gray-500 dark:text-gray-400 truncate mt-0.5 mb-2">
                    {n.content?.substring(0, 60) || "No content..."}
                  </p>
                  <div className="flex items-center gap-2 flex-wrap">
                    {currentFolder && (
                      <div className="flex items-center gap-1 text-xs text-gray-600 dark:text-gray-400 bg-gray-100 dark:bg-gray-700 px-2 py-1 rounded">
                        <FolderIcon className="h-3 w-3 flex-shrink-0" />
                        <span className="truncate">{currentFolder.name}</span>
                      </div>
                    )}
                    {n.isEncrypted === 1 && (
                      <div className="flex items-center gap-1 text-xs text-green-700 dark:text-green-300 bg-green-50 dark:bg-green-900/20 px-2 py-1 rounded border border-green-200 dark:border-green-800">
                        <LockClosedIcon className="h-3 w-3 flex-shrink-0" />
                        <span>Encrypted</span>
                      </div>
                    )}
                    <span className="text-xs text-gray-500 dark:text-gray-500 ml-auto">
                      {lastModified}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          );
        })
      ) : (
        <div className="flex items-center justify-center py-8 text-center animate-fadeIn">
          <div className="space-y-2">
            {searchQuery ? (
              <>
                <p className="text-xs font-medium text-gray-500 dark:text-gray-400">
                  No notes match "{searchQuery}"
                </p>
                <p className="text-xs text-gray-400 dark:text-gray-500">
                  Try adjusting your search terms
                </p>
              </>
            ) : (
              <>
                <p className="text-xs font-medium text-gray-500 dark:text-gray-400">
                  No notes found
                </p>
                <p className="text-xs text-gray-400 dark:text-gray-500">
                  Create a new note to get started
                </p>
              </>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
