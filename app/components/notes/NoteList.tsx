import { FolderIcon } from "@heroicons/react/24/outline";

export function NoteList({
  notes,
  folders,
  filteredNotes,
  selectedNoteId,
  setSelectedNoteId,
  setIsEditing,
  setDraggedNoteId,
  draggedNoteId,
}: any) {
  return (
    <div className="flex-grow overflow-y-auto space-y-1.5">
      {filteredNotes.length > 0 ? (
        filteredNotes.map((n: any) => {
          const currentFolder = folders.find((f: any) => f.id === n.folderId);
          const isSelected = selectedNoteId === n.id;
          const isDragged = draggedNoteId === n.id;

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
              className={`p-3 rounded-lg cursor-grab active:cursor-grabbing transition-all duration-150 border ${
                isDragged
                  ? "opacity-50 bg-gray-100 dark:bg-gray-700 border-gray-400 dark:border-gray-600"
                  : isSelected
                    ? "bg-white dark:bg-gray-800 border-gray-400 dark:border-gray-600 ring-1 ring-gray-400 dark:ring-gray-600 shadow-md"
                    : "bg-white dark:bg-gray-800 border-gray-300 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-750 shadow-sm hover:shadow-md"
              }`}
              role="option"
              aria-selected={isSelected}
            >
              <h3 className="font-semibold text-gray-900 dark:text-gray-100 truncate">
                {n.title || "Untitled Note"}
              </h3>
              <p className="text-sm text-gray-500 dark:text-gray-400 truncate mt-1">
                {n.content?.substring(0, 80) || "No content..."}
              </p>
              {currentFolder && (
                <div className="text-xs text-gray-600 dark:text-gray-400 mt-2 flex items-center gap-1">
                  <FolderIcon className="h-3.5 w-3.5 flex-shrink-0" />
                  <span className="truncate">{currentFolder.name}</span>
                </div>
              )}
            </div>
          );
        })
      ) : (
        <div className="flex items-center justify-center py-8 text-center">
          <p className="text-sm text-gray-500 dark:text-gray-400">
            No notes found.
          </p>
        </div>
      )}
    </div>
  );
}
