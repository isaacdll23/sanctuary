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
    <div className="flex-grow overflow-y-auto space-y-1 p-1">
      {filteredNotes.length > 0 ? (
        filteredNotes.map((n: any) => {
          const currentFolder = folders.find((f: any) => f.id === n.folderId);
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
              className={`p-3 rounded-lg cursor-grab mb-2 transition-colors
                ${draggedNoteId === n.id ? "opacity-50 bg-purple-700" : ""}
                ${
                  selectedNoteId === n.id
                    ? "bg-purple-600 ring-2 ring-purple-400 shadow-lg"
                    : "bg-white hover:bg-gray-50 dark:bg-gray-800 dark:hover:bg-gray-700 shadow-md"
                }
              `}
            >
              <h3 className="font-semibold text-gray-900 dark:text-gray-100 truncate">
                {n.title || "Untitled Note"}
              </h3>
              <p className="text-sm text-gray-600 dark:text-gray-400 truncate mt-1">
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
        <p className="text-gray-600 dark:text-gray-400 text-center py-4">
          No notes found.
        </p>
      )}
    </div>
  );
}
