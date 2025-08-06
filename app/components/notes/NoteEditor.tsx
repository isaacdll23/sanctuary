import { useState, useEffect, useRef } from "react"; // Added useRef
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
  fetcher: any; // This is the complex fetcher object from NotesPage
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

  // Use fetcher.titleFetcher for title generation
  const titleGenerationFetcher = fetcher.titleFetcher || {
    state: "idle",
    data: null,
    submit: () => {},
  };
  // Use the main fetcher parts for note submission
  const noteSubmissionFetcher = {
    state: fetcher.state,
    data: fetcher.data,
    submit: fetcher.submit,
  };

  const isNew = !note;
  const { addToast } = useToast();

  const prevSubmitFetcherStateRef = useRef<string | undefined>(
    noteSubmissionFetcher.state
  );

  // Ref to track the key of the note currently loaded in the editor (note.id or "new")
  const loadedNoteKeyRef = useRef<string | number | null | undefined>(
    undefined
  );
  // Ref to track the initial folderId when editing a new note, to detect if the prop changes
  const initialFolderIdForNewNoteRef = useRef<number | null | undefined>(
    undefined
  );

  useEffect(() => {
    const currentKey = note ? note.id : isNew ? "new" : null; // Represents the entity being edited

    let needsReset = false;
    if (currentKey !== loadedNoteKeyRef.current) {
      // Switched to a different note, or to/from a new note editor
      needsReset = true;
      if (currentKey === "new") {
        // When switching to a "new" note editor, store its initial folderId prop
        initialFolderIdForNewNoteRef.current = folderId;
      }
    } else if (
      currentKey === "new" &&
      folderId !== initialFolderIdForNewNoteRef.current
    ) {
      // Still editing a "new" note, but the folderId prop from parent changed
      needsReset = true;
      initialFolderIdForNewNoteRef.current = folderId; // Update the stored initial folderId
    }

    if (needsReset) {
      setTitle(note?.title || "");
      setContent(note?.content || "");
      setSelectedFolder(note?.folderId || folderId || null); // Use note.folderId for existing, folderId prop for new
      loadedNoteKeyRef.current = currentKey;
    }
  }, [note, folderId, isNew]); // isNew is derived from !note

  useEffect(() => {
    // Effect for title generation (uses titleGenerationFetcher)
    if (
      titleGenerationFetcher.state === "idle" &&
      titleGenerationFetcher.data
    ) {
      setIsGeneratingTitle(false);
      if (
        titleGenerationFetcher.data.success &&
        titleGenerationFetcher.data.title
      ) {
        setTitle(titleGenerationFetcher.data.title); // Only update title
        addToast("Title generated successfully.", "success", 3000);
      } else if (titleGenerationFetcher.data.error) {
        addToast(
          `Failed to generate title: ${titleGenerationFetcher.data.error}`,
          "error",
          3000
        );
        console.error(
          "Title generation error:",
          titleGenerationFetcher.data.error
        );
      }
    } else if (titleGenerationFetcher.state === "loading") {
      setIsGeneratingTitle(true);
    }
  }, [titleGenerationFetcher.state, titleGenerationFetcher.data, addToast]);

  // Effect for handling main note submission success toasts (uses noteSubmissionFetcher)
  useEffect(() => {
    const previousState = prevSubmitFetcherStateRef.current;
    if (
      noteSubmissionFetcher.state === "idle" &&
      previousState === "loading" &&
      noteSubmissionFetcher.data
    ) {
      if (noteSubmissionFetcher.data.success) {
        const message = isNew
          ? "Note created successfully."
          : "Note updated successfully.";
        addToast(message, "success", 3000);
      }
      // Error toasts for this fetcher are assumed to be handled by the parent component (NotesPage)
    }
    prevSubmitFetcherStateRef.current = noteSubmissionFetcher.state;
  }, [
    noteSubmissionFetcher.state,
    noteSubmissionFetcher.data,
    addToast,
    isNew,
  ]);

  const hasChanges =
    isNew ||
    (note &&
      (title !== note.title ||
        content !== note.content ||
        selectedFolder !== note.folderId));

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
    // Use the main fetcher's submit for saving notes
    noteSubmissionFetcher.submit(submissionData, {
      method: "post",
      action: "/notes",
    });
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
    // Use the titleGenerationFetcher for generating titles
    titleGenerationFetcher.submit(
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
      className="space-y-6 flex flex-col h-full" // Increased spacing and flex for layout
    >
      <div>
        <label
          htmlFor="note-title"
          className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5" // Adjusted margin
        >
          Title
        </label>
        <div className="flex gap-2">
          <input
            id="note-title"
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            className="flex-1 bg-gray-100 border border-gray-300 text-gray-900 dark:bg-gray-800 dark:border-gray-700 dark:text-gray-100 rounded-md p-3 focus:ring-2 focus:ring-purple-500 focus:border-purple-500 shadow-sm" // Refined styling
            placeholder="Enter note title"
            autoFocus
          />
          <button
            type="button"
            onClick={handleGenerateTitle}
            disabled={isGeneratingTitle}
            title="Generate title from content"
            aria-label="Generate title from content"
            className="flex-shrink-0 px-4 py-2 rounded-md bg-purple-600 text-white font-medium hover:bg-purple-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed focus:outline-none focus:ring-2 focus:ring-purple-500 focus:ring-offset-2 focus:ring-offset-slate-900" // Added focus styling
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
      <div className="flex-grow flex flex-col">
        {" "}
        {/* Added flex-grow for content area */}
        <label
          htmlFor="note-content"
          className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5" // Adjusted margin
        >
          Content
        </label>
        <textarea
          id="note-content"
          value={content}
          onChange={(e) => setContent(e.target.value)}
          className="w-full flex-grow bg-gray-100 border border-gray-300 text-gray-900 dark:bg-gray-800 dark:border-gray-700 dark:text-gray-100 rounded-md p-3 focus:ring-2 focus:ring-purple-500 focus:border-purple-500 shadow-sm resize-none" // Refined styling, flex-grow, resize-none
          placeholder="Enter note content"
          rows={15} // Increased rows for more vertical space
        />
      </div>
      <div>
        <label
          htmlFor="note-folder"
          className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5" // Adjusted margin
        >
          Folder
        </label>
        <select
          id="note-folder"
          value={selectedFolder ?? ""}
          onChange={(e) =>
            setSelectedFolder(e.target.value ? parseInt(e.target.value) : null)
          }
          className="w-full bg-gray-100 border border-gray-300 text-gray-900 dark:bg-gray-800 dark:border-gray-700 dark:text-gray-100 rounded-md p-3 focus:ring-2 focus:ring-purple-500 focus:border-purple-500 shadow-sm" // Refined styling
        >
          <option value="">No Folder</option>
          {folders.map((folder) => (
            <option key={folder.id} value={folder.id}>
              {folder.name}
            </option>
          ))}
        </select>
      </div>
      <div className="flex justify-end gap-3 pt-2">
        {" "}
        {/* Adjusted gap and padding */}
        <button
          type="button" // Explicitly set type to button
          onClick={onCancel}
          className="px-4 py-2 rounded-md bg-gray-300 text-gray-800 hover:bg-gray-400 dark:bg-gray-600 dark:text-gray-100 dark:hover:bg-gray-500 font-medium transition-colors focus:outline-none focus:ring-2 focus:ring-gray-500 focus:ring-offset-2" // Refined styling for secondary button
        >
          Cancel
        </button>
        <button
          type="submit"
          disabled={!isNew && !hasChanges}
          className="px-4 py-2 rounded-md bg-gradient-to-r from-purple-600 to-pink-600 text-white font-medium hover:from-purple-700 hover:to-pink-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed focus:outline-none focus:ring-2 focus:ring-purple-500 focus:ring-offset-2 focus:ring-offset-slate-900 shadow-md" // Refined styling for primary button
        >
          {isNew ? "Create Note" : "Save Changes"}
        </button>
      </div>
    </form>
  );
}
