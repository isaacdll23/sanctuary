import { useState, useEffect } from "react";
import { SparklesIcon } from "@heroicons/react/24/outline";
import { useToast } from "~/hooks/useToast";
import ReactMarkdown from "react-markdown";

export function NoteEditor({
  note,
  fetcher,
  onCancel,
  folderId,
  folders,
}: {
  note?: any;
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
  const [isGeneratingTitle, setIsGeneratingTitle] = useState(false);
  const titleFetcher = fetcher.titleFetcher || {
    state: "idle",
    data: null,
    submit: () => {},
  };
  const isNew = !note;
  const { addToast } = useToast();

  useEffect(() => {
    setTitle(note?.title || "");
    setContent(note?.content || "");
    setSelectedFolder(note?.folderId || folderId || null);
  }, [note, folderId]);

  useEffect(() => {
    if (titleFetcher.state === "idle" && titleFetcher.data) {
      setIsGeneratingTitle(false);
      if (titleFetcher.data.success && titleFetcher.data.title) {
        setTitle(titleFetcher.data.title);
        addToast("Title generated successfully.", "success", 3000);
      } else if (titleFetcher.data.error) {
        addToast(
          `Failed to generate title: ${titleFetcher.data.error}`,
          "error",
          3000
        );
        console.error("Title generation error:", titleFetcher.data.error);
      }
    } else if (titleFetcher.state === "loading") {
      setIsGeneratingTitle(true);
    }
  }, [titleFetcher.state, titleFetcher.data, addToast]);

  const hasChanges = isNew || (note && (title !== note.title || content !== note.content || selectedFolder !== note.folderId));

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    const currentTitle = title.trim();
    const currentContent = content.trim();
    
    if (!isNew && !hasChanges) {
      e.preventDefault();
      addToast("No changes detected.", "info", 3000);
      onCancel();
      return;
    }
    const submissionData: any = {
      intent: isNew ? "createNote" : "updateNote",
      title: currentTitle,
      content: currentContent,
      folderId: selectedFolder ? selectedFolder.toString() : "",
    };
    if (!isNew && note) {
      submissionData.noteId = note.id.toString();
    }
    fetcher.submit(submissionData, { method: "post", action: "/notes" });
  };
  const handleGenerateTitle = (e: React.MouseEvent) => {
    e.preventDefault();
    if (!content.trim()) {
      addToast(
        "Please add some content before generating a title.",
        "info",
        3000
      );
      return;
    }
    setIsGeneratingTitle(true);
    titleFetcher.submit(
      {
        intent: "generateNoteTitle",
        content: content,
      },
      { method: "post", action: "/notes" }
    );
  };

  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        handleSubmit(e);
      }}
      className="space-y-4"
    >
      <div>
        <label className="block text-sm font-medium text-slate-300 mb-1">
          Title
        </label>
        <div className="flex gap-2">
          <input
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            className="flex-1 bg-slate-800 border border-slate-600 rounded-lg p-3 text-slate-100 focus:ring-purple-500 focus:border-purple-500"
            placeholder="Enter note title"
            autoFocus
          />
          <button
            type="button"
            onClick={handleGenerateTitle}
            disabled={isGeneratingTitle}
            title="Generate title from content"
            aria-label="Generate title from content"
            className="flex-shrink-0 px-4 py-2 rounded-lg bg-purple-600 text-white font-medium hover:bg-purple-700 transition-colors disabled:opacity-50"
          >
            {isGeneratingTitle ? (
              <svg
                className="h-5 w-5 animate-spin"
                xmlns="http://www.w3.org/2000/svg"
                fill="none"
                viewBox="0 0 24 24"
              >
                <circle
                  className="opacity-25"
                  cx="12"
                  cy="12"
                  r="10"
                  stroke="currentColor"
                  strokeWidth="4"
                />
                <path
                  className="opacity-75"
                  fill="currentColor"
                  d="M12 2a10 10 0 100 20 10 10 0 000-20zm1 18V4a8 8 0 010 16z"
                />
              </svg>
            ) : (
              <SparklesIcon className="h-5 w-5" />
            )}
          </button>
        </div>
      </div>
      <div>
        <label className="block text-sm font-medium text-slate-300 mb-1">
          Content
        </label>
        <textarea
          value={content}
          onChange={(e) => setContent(e.target.value)}
          className="w-full bg-slate-800 border border-slate-600 rounded-lg p-3 text-slate-100 focus:ring-purple-500 focus:border-purple-500"
          placeholder="Enter note content"
          rows={8}
        />
      </div>
      <div>
        <label className="block text-sm font-medium text-slate-300 mb-1">
          Folder
        </label>
        <select
          value={selectedFolder ?? ""}
          onChange={(e) =>
            setSelectedFolder(e.target.value ? parseInt(e.target.value) : null)
          }
          className="w-full bg-slate-800 border border-slate-600 rounded-lg p-3 text-slate-100 focus:ring-purple-500 focus:border-purple-500"
        >
          <option value="">No Folder</option>
          {folders.map((folder) => (
            <option key={folder.id} value={folder.id}>
              {folder.name}
            </option>
          ))}
        </select>
      </div>
      <div className="flex justify-end gap-2">
        <button
          onClick={onCancel}
          className="px-4 py-2 rounded-lg bg-slate-700 text-white font-medium hover:bg-slate-600 transition-colors"
        >
          Cancel
        </button>
        <button
          type="submit"
          disabled={!isNew && !hasChanges}
          className="px-4 py-2 rounded-lg bg-gradient-to-r from-purple-500 to-pink-600 text-white font-medium hover:from-purple-600 hover:to-pink-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {isNew ? "Create Note" : "Save Changes"}
        </button>
      </div>
    </form>
  );
}
