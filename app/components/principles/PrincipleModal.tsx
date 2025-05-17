import { useState, useEffect } from "react";
import type { FetcherWithComponents } from "react-router";
import type { principlesTable } from "~/db/schema";
import { XMarkIcon, PencilIcon, CheckIcon, TrashIcon } from "@heroicons/react/24/outline";
import ReactMarkdown from 'react-markdown';

export default function PrincipleModal({
  principle,
  isNew = false,
  fetcher,
  onClose,
}: {
  principle?: typeof principlesTable.$inferSelect;
  isNew?: boolean;
  fetcher: FetcherWithComponents<any>;
  onClose: () => void;
}) {
  const [title, setTitle] = useState(principle?.title || "");
  const [content, setContent] = useState(principle?.content || "");
  const [isEditing, setIsEditing] = useState(isNew);
  const [previewMode, setPreviewMode] = useState(!isNew);

  // Reset fields if principle changes
  useEffect(() => {
    if (principle) {
      setTitle(principle.title);
      setContent(principle.content);
    }
    setIsEditing(isNew);
  }, [principle, isNew]);

  const handleSubmit = () => {
    // Form will be submitted via fetcher.Form
    setIsEditing(false);
    setPreviewMode(true);
  };

  const handleDelete = () => {
    if (window.confirm("Are you sure you want to delete this principle?")) {
      fetcher.submit(
        { 
          intent: "deletePrinciple", 
          principleId: principle?.id.toString() || "" 
        },
        { method: "post" }
      );
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4 animate-modal-pop-in"
      onClick={onClose}
    >
      <div
        className="bg-slate-800 border border-slate-700 rounded-2xl shadow-2xl w-full max-w-lg md:max-w-xl lg:max-w-2xl max-h-[90vh] flex flex-col transform transition-all duration-300 ease-out"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Modal Header */}
        <div className="flex justify-between items-center p-5 md:p-6 border-b border-slate-700">
          {isEditing ? (
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="text-xl md:text-2xl font-semibold bg-slate-700 text-slate-100 rounded-md p-2 flex-grow mr-4 focus:ring-2 focus:ring-purple-500"
              placeholder="Principle Title"
            />
          ) : (
            <h2 className="text-xl md:text-2xl font-semibold bg-clip-text text-transparent bg-gradient-to-r from-purple-400 to-pink-600 truncate pr-4">
              {title || "New Principle"}
            </h2>
          )}
          
          <div className="flex items-center">
            {!isEditing && !isNew && (
              <>
                <button
                  onClick={() => setIsEditing(true)}
                  className="text-slate-400 hover:text-purple-400 p-2 rounded-md transition-colors mr-2"
                  aria-label="Edit principle"
                >
                  <PencilIcon className="h-5 w-5" />
                </button>
                <button
                  onClick={handleDelete}
                  className="text-slate-400 hover:text-red-500 p-2 rounded-md transition-colors mr-2"
                  aria-label="Delete principle"
                >
                  <TrashIcon className="h-5 w-5" />
                </button>
              </>
            )}
            <button
              onClick={onClose}
              className="text-slate-400 hover:text-slate-200 p-2 rounded-md transition-colors"
              aria-label="Close modal"
            >
              <XMarkIcon className="h-6 w-6" />
            </button>
          </div>
        </div>

        {/* Modal Body */}
        <div className="p-5 md:p-6 flex-1 overflow-y-auto">
          {isEditing ? (
            <fetcher.Form method="post" onSubmit={handleSubmit}>
              <input type="hidden" name="intent" value={isNew ? "createPrinciple" : "updatePrinciple"} />
              {!isNew && principle && (
                <input type="hidden" name="principleId" value={principle.id} />
              )}
              <input type="hidden" name="title" value={title} />
              
              <div className="mb-4">
                <div className="flex justify-between mb-2">
                  <label htmlFor="content" className="text-sm font-medium text-slate-400">
                    Content (Markdown supported)
                  </label>
                  <button
                    type="button"
                    onClick={() => setPreviewMode(!previewMode)}
                    className="text-sm text-purple-400 hover:text-purple-300"
                  >
                    {previewMode ? "Edit" : "Preview"}
                  </button>
                </div>
                
                {previewMode ? (
                  <div className="prose prose-invert prose-sm md:prose-base max-w-none bg-slate-700 rounded-lg p-4 min-h-[200px] overflow-auto">
                    <ReactMarkdown>{content}</ReactMarkdown>
                  </div>
                ) : (
                  <textarea
                    id="content"
                    name="content"
                    value={content}
                    onChange={(e) => setContent(e.target.value)}
                    rows={10}
                    className="w-full bg-slate-700 text-slate-100 rounded-lg p-4 focus:ring-2 focus:ring-purple-500"
                    placeholder="Write your principle content here... Markdown is supported."
                  />
                )}
              </div>

              <div className="flex justify-end mt-6 space-x-3">
                <button
                  type="button"
                  onClick={onClose}
                  className="px-4 py-2 rounded-lg border border-slate-600 text-slate-300 hover:bg-slate-700 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 rounded-lg bg-gradient-to-r from-purple-500 to-pink-600 text-white font-medium hover:from-purple-600 hover:to-pink-700 transition-colors"
                >
                  {isNew ? "Create Principle" : "Save Changes"}
                </button>
              </div>
            </fetcher.Form>
          ) : (
            <div className="prose prose-invert prose-sm md:prose-base max-w-none">
              <ReactMarkdown>{content}</ReactMarkdown>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
