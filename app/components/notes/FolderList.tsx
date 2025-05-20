import { FolderIcon, PencilIcon, TrashIcon, XMarkIcon, FolderPlusIcon } from "@heroicons/react/24/outline";
import { useState } from "react";
import { useToast } from "~/hooks/useToast";

export function FolderList({
  folders,
  selectedFolderId,
  setSelectedFolderId,
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
  handleFolderSelect
}: any) {
  return (
    <div>
      <button
        onClick={() => setShowFolderInput((v: boolean) => !v)}
        className="w-full flex items-center justify-center px-4 py-2 rounded-lg bg-slate-700 text-white font-medium hover:bg-slate-600 transition-colors"
      >
        <FolderPlusIcon className="h-5 w-5 mr-2" />
        {showFolderInput ? "Cancel" : "New Folder"}
      </button>
      {showFolderInput && (
        <div className="flex p-2 bg-slate-800 rounded-lg shadow">
          <input
            type="text"
            className="flex-1 bg-slate-700 border border-slate-600 rounded-l-lg p-2 focus:ring-purple-500 focus:border-purple-500 placeholder-slate-400"
            placeholder="Enter folder name..."
            value={newFolderName}
            onChange={(e) => setNewFolderName(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && handleCreateFolder()}
          />
          <button
            onClick={handleCreateFolder}
            className="px-4 py-2 rounded-r-lg bg-purple-600 text-white hover:bg-purple-700 transition-colors font-semibold"
          >
            Add
          </button>
        </div>
      )}
      <div className="flex-grow overflow-y-auto space-y-1 p-1">
        <div
          className={`group w-full flex items-center justify-between px-3 py-2 rounded-lg transition-colors cursor-pointer mb-2
            ${dragOverTargetId === "all" ? "bg-purple-800 ring-2 ring-purple-400" : ""}
            ${selectedFolderId === null ? "bg-slate-700 ring-2 ring-purple-500" : "bg-slate-800 hover:bg-slate-700"}
          `}
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
                  folderId: "",
                },
                { method: "post", action: "/notes" }
              );
              addToast("Note removed from folder.", "success", 3000);
              setDraggedNoteId(null);
              setDragOverTargetId(null);
            }
          }}
        >
          <div className="flex items-center">
            <FolderIcon className="h-5 w-5 mr-2 text-slate-400" />
            All Notes
          </div>
        </div>
        {folders.map((folder: any) => (
          <div
            key={folder.id}
            className={`group w-full flex items-center justify-between px-3 py-2 rounded-lg transition-colors cursor-pointer mb-1
              ${dragOverTargetId === folder.id ? "bg-purple-800 ring-2 ring-purple-400" : ""}
              ${selectedFolderId === folder.id ? "bg-slate-700 ring-2 ring-purple-500" : "bg-slate-800 hover:bg-slate-700"}
            `}
            onClick={() =>
              editingFolderId !== folder.id && handleFolderSelect(folder.id)
            }
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
          >
            {editingFolderId === folder.id ? (
              <div className="flex-1 flex items-center">
                <input
                  type="text"
                  value={editingFolderName}
                  onChange={(e) => setEditingFolderName(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") {
                      handleRenameFolder(folder.id);
                    } else if (e.key === "Escape") {
                      setEditingFolderId(null);
                      setEditingFolderName("");
                    }
                  }}
                  className="flex-1 bg-slate-700 border border-purple-500 rounded-md p-1 text-sm focus:ring-1 focus:ring-purple-400"
                  autoFocus
                  onBlur={() => {
                    setTimeout(() => {
                      if (editingFolderId === folder.id) {
                        handleRenameFolder(folder.id);
                        setEditingFolderId(null);
                        setEditingFolderName("");
                      }
                    }, 100);
                  }}
                />
                <button
                  onClick={() => handleRenameFolder(folder.id)}
                  className="p-1 text-green-400 hover:text-green-300"
                  aria-label="Save folder name"
                >
                  <PencilIcon className="h-4 w-4" />
                </button>
                <button
                  onClick={() => {
                    setEditingFolderId(null);
                    setEditingFolderName("");
                  }}
                  className="p-1 text-slate-400 hover:text-slate-300"
                  aria-label="Cancel rename"
                >
                  <XMarkIcon className="h-4 w-4" />
                </button>
              </div>
            ) : (
              <div className="flex items-center flex-1 min-w-0">
                <FolderIcon className="h-5 w-5 mr-2 text-purple-400 flex-shrink-0" />
                <span className="truncate" title={folder.name}>
                  {folder.name}
                </span>
              </div>
            )}
            {editingFolderId !== folder.id && (
              <div className="flex items-center opacity-0 group-hover:opacity-100 transition-opacity">
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    setEditingFolderId(folder.id);
                    setEditingFolderName(folder.name);
                  }}
                  className="p-1 text-slate-400 hover:text-purple-400"
                  aria-label="Rename folder"
                >
                  <PencilIcon className="h-4 w-4" />
                </button>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    handleDeleteFolder(folder.id, folder.name);
                  }}
                  className="p-1 text-slate-400 hover:text-red-500"
                  aria-label="Delete folder"
                >
                  <TrashIcon className="h-4 w-4" />
                </button>
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
