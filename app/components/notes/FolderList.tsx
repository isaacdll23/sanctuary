import {
  FolderIcon,
  PencilIcon,
  TrashIcon,
  XMarkIcon,
  FolderPlusIcon,
} from "@heroicons/react/24/outline";
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
  handleFolderSelect,
}: any) {
  return (
    <div className="flex flex-col space-y-2.5">
      {/* New Folder Button */}
      <button
        onClick={() => setShowFolderInput((v: boolean) => !v)}
        className="w-full flex items-center justify-center px-3 py-2.5 rounded-lg bg-gray-200 dark:bg-gray-700 text-gray-900 dark:text-gray-100 font-medium hover:bg-gray-300 dark:hover:bg-gray-600 focus:outline-none focus:ring-2 focus:ring-gray-400 dark:focus:ring-gray-600 transition-all duration-150 min-h-[40px]"
      >
        <FolderPlusIcon className="h-5 w-5 mr-2" />
        {showFolderInput ? "Cancel" : "New Folder"}
      </button>

      {/* New Folder Input */}
      {showFolderInput && (
        <div className="flex gap-2 p-3 bg-gray-100 dark:bg-gray-800 rounded-lg border border-gray-300 dark:border-gray-700 shadow-sm">
          <input
            type="text"
            className="flex-1 px-3 py-2 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 text-gray-900 dark:text-gray-100 rounded-md focus:ring-2 focus:ring-gray-400 dark:focus:ring-gray-600 focus:border-transparent placeholder-gray-400 dark:placeholder-gray-500 transition-all duration-150"
            placeholder="Enter folder name..."
            value={newFolderName}
            onChange={(e) => setNewFolderName(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && handleCreateFolder()}
            autoFocus
          />
          <button
            onClick={handleCreateFolder}
            disabled={!newFolderName.trim()}
            className="px-3 py-2 rounded-md bg-gray-900 dark:bg-gray-100 text-white dark:text-gray-900 hover:bg-gray-800 dark:hover:bg-gray-200 disabled:opacity-50 disabled:cursor-not-allowed font-semibold transition-all duration-150 focus:outline-none focus:ring-2 focus:ring-gray-400 dark:focus:ring-gray-600"
          >
            Add
          </button>
        </div>
      )}

      {/* Folders List */}
      <div className="flex-grow overflow-y-auto space-y-1.5">
        {/* All Notes Item */}
        <div
          className={`group w-full flex items-center justify-between px-3 py-2.5 rounded-lg transition-all duration-150 cursor-pointer border ${
            dragOverTargetId === "all"
              ? "bg-gray-200 dark:bg-gray-700 border-gray-400 dark:border-gray-600 ring-2 ring-gray-400 dark:ring-gray-500"
              : selectedFolderId === null
                ? "bg-gray-200 dark:bg-gray-700 border-gray-300 dark:border-gray-600 ring-1 ring-gray-400 dark:ring-gray-600"
                : "bg-white dark:bg-gray-800 border-gray-300 dark:border-gray-700 hover:bg-gray-100 dark:hover:bg-gray-700"
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
                  folderId: "",
                },
                { method: "post", action: "/notes" }
              );
              addToast("Note removed from folder.", "success", 3000);
              setDraggedNoteId(null);
              setDragOverTargetId(null);
            }
          }}
          role="option"
          aria-selected={selectedFolderId === null}
        >
          <div className="flex items-center gap-2">
            <FolderIcon className="h-5 w-5 text-gray-500 dark:text-gray-400 flex-shrink-0" />
            <span className="text-gray-900 dark:text-gray-100 font-medium">
              All Notes
            </span>
          </div>
        </div>

        {/* Individual Folders */}
        {folders.map((folder: any) => (
          <div
            key={folder.id}
            className={`group w-full flex items-center justify-between px-3 py-2.5 rounded-lg transition-all duration-150 cursor-pointer border ${
              dragOverTargetId === folder.id
                ? "bg-gray-200 dark:bg-gray-700 border-gray-400 dark:border-gray-600 ring-2 ring-gray-400 dark:ring-gray-500"
                : selectedFolderId === folder.id
                  ? "bg-gray-200 dark:bg-gray-700 border-gray-300 dark:border-gray-600 ring-1 ring-gray-400 dark:ring-gray-600"
                  : "bg-white dark:bg-gray-800 border-gray-300 dark:border-gray-700 hover:bg-gray-100 dark:hover:bg-gray-700"
            }`}
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
            role="option"
            aria-selected={selectedFolderId === folder.id}
          >
            {editingFolderId === folder.id ? (
              // Edit Mode
              <div className="flex-1 flex items-center gap-2">
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
                  className="flex-1 px-2 py-1 bg-white dark:bg-gray-700 border border-gray-400 dark:border-gray-600 text-gray-900 dark:text-gray-100 rounded-md text-sm focus:ring-2 focus:ring-gray-400 dark:focus:ring-gray-600 focus:border-transparent transition-all duration-150"
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
                  className="p-1.5 text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-200 rounded-md hover:bg-gray-200 dark:hover:bg-gray-600 transition-all duration-150"
                  aria-label="Save folder name"
                  title="Save"
                >
                  <PencilIcon className="h-4 w-4" />
                </button>
                <button
                  onClick={() => {
                    setEditingFolderId(null);
                    setEditingFolderName("");
                  }}
                  className="p-1.5 text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-200 rounded-md hover:bg-gray-200 dark:hover:bg-gray-600 transition-all duration-150"
                  aria-label="Cancel rename"
                  title="Cancel"
                >
                  <XMarkIcon className="h-4 w-4" />
                </button>
              </div>
            ) : (
              // View Mode
              <>
                <div className="flex items-center gap-2 flex-1 min-w-0">
                  <FolderIcon className="h-5 w-5 text-gray-500 dark:text-gray-400 flex-shrink-0" />
                  <span
                    className="text-gray-900 dark:text-gray-100 font-medium truncate"
                    title={folder.name}
                  >
                    {folder.name}
                  </span>
                </div>

                {/* Action Buttons */}
                <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity duration-150">
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      setEditingFolderId(folder.id);
                      setEditingFolderName(folder.name);
                    }}
                    className="p-1.5 text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-200 rounded-md hover:bg-gray-200 dark:hover:bg-gray-600 transition-all duration-150 focus:outline-none focus:ring-2 focus:ring-gray-400 dark:focus:ring-gray-600"
                    aria-label={`Rename ${folder.name}`}
                    title="Rename folder"
                  >
                    <PencilIcon className="h-4 w-4" />
                  </button>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      handleDeleteFolder(folder.id, folder.name);
                    }}
                    className="p-1.5 text-gray-600 dark:text-gray-400 hover:text-red-500 dark:hover:text-red-400 rounded-md hover:bg-red-50 dark:hover:bg-red-900/20 transition-all duration-150 focus:outline-none focus:ring-2 focus:ring-red-400 dark:focus:ring-red-600"
                    aria-label={`Delete ${folder.name}`}
                    title="Delete folder"
                  >
                    <TrashIcon className="h-4 w-4" />
                  </button>
                </div>
              </>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
