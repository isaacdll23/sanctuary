import { useState, useEffect, useRef } from "react";
import { SparklesIcon, CheckIcon, ExclamationTriangleIcon, EyeIcon, EyeSlashIcon } from "@heroicons/react/24/outline";
import { useToast } from "~/hooks/useToast";
import { useAutoSave } from "~/hooks/useAutoSave";
import { AdvancedNoteEditor } from "./AdvancedNoteEditor";
import { EditorSettings } from "./EditorSettings";
import { SplitViewContainer } from "./SplitViewContainer";
import { MarkdownPreviewPane } from "./MarkdownPreviewPane";
import {
  loadEditorPreferences,
  saveEditorPreferences,
  type EditorPreferences,
} from "~/utils/editorPreferences";

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
  const [lastSubmitTime, setLastSubmitTime] = useState(0);
  const [editorPreferences, setEditorPreferences] = useState<EditorPreferences>(
    () => loadEditorPreferences()
  );
  const [isMobileEditor, setIsMobileEditor] = useState(() => {
    if (typeof window === "undefined") return false;
    return window.matchMedia("(max-width: 767px)").matches;
  });
  const [showPreview, setShowPreview] = useState(() => {
    if (typeof window !== "undefined") {
      const saved = localStorage.getItem("noteEditorShowPreview");
      if (saved) {
        return JSON.parse(saved);
      }
      return !window.matchMedia("(max-width: 767px)").matches;
    }
    return true;
  });

  const isNew = !note;

  // Initialize auto-save hook (only for existing notes)
  const { scheduleAutoSave, autoSaveState } = useAutoSave(
    note?.id,
    title,
    content,
    selectedFolder,
    {
      debounceMs: 3000,
      enabled: !isNew, // Only auto-save existing notes
    }
  );

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

  const { addToast } = useToast();

  const prevSubmitFetcherStateRef = useRef<string | undefined>(
    noteSubmissionFetcher.state
  );

  // Ref to track the key of the note currently loaded in the editor
  const loadedNoteKeyRef = useRef<string | number | null | undefined>(
    undefined
  );
  // Ref to track the initial folderId when editing a new note
  const initialFolderIdForNewNoteRef = useRef<number | null | undefined>(
    undefined
  );

  // Persist preview state to localStorage
  useEffect(() => {
    if (typeof window !== "undefined") {
      localStorage.setItem("noteEditorShowPreview", JSON.stringify(showPreview));
    }
  }, [showPreview]);

  useEffect(() => {
    if (typeof window === "undefined") return;
    const mediaQuery = window.matchMedia("(max-width: 767px)");
    const handleChange = (event: MediaQueryListEvent) => {
      setIsMobileEditor(event.matches);
    };

    setIsMobileEditor(mediaQuery.matches);
    mediaQuery.addEventListener("change", handleChange);
    return () => mediaQuery.removeEventListener("change", handleChange);
  }, []);

  useEffect(() => {
    const currentKey = note ? note.id : isNew ? "new" : null;

    let needsReset = false;
    if (currentKey !== loadedNoteKeyRef.current) {
      needsReset = true;
      if (currentKey === "new") {
        initialFolderIdForNewNoteRef.current = folderId;
      }
    } else if (
      currentKey === "new" &&
      folderId !== initialFolderIdForNewNoteRef.current
    ) {
      needsReset = true;
      initialFolderIdForNewNoteRef.current = folderId;
    }

    if (needsReset) {
      setTitle(note?.title || "");
      setContent(note?.content || "");
      setSelectedFolder(note?.folderId || folderId || null);
      setLastSubmitTime(0);
      loadedNoteKeyRef.current = currentKey;
    }
  }, [note, folderId, isNew]);

  useEffect(() => {
    if (
      titleGenerationFetcher.state === "idle" &&
      titleGenerationFetcher.data
    ) {
      setIsGeneratingTitle(false);
      if (
        titleGenerationFetcher.data.success &&
        titleGenerationFetcher.data.title
      ) {
        setTitle(titleGenerationFetcher.data.title);
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

  // Trigger auto-save when content changes
  useEffect(() => {
    scheduleAutoSave();
  }, [title, content, selectedFolder, scheduleAutoSave]);

  // Handle main note submission with lastSubmitTime to prevent stale data issues
  useEffect(() => {
    const previousState = prevSubmitFetcherStateRef.current;
    if (
      noteSubmissionFetcher.state === "idle" &&
      previousState === "loading" &&
      noteSubmissionFetcher.data &&
      lastSubmitTime > 0
    ) {
      if (noteSubmissionFetcher.data.success) {
        const message = isNew
          ? "Note created successfully."
          : "Note updated successfully.";
        addToast(message, "success", 3000);
        // Auto-close the editor after success
        setTimeout(() => {
          onCancel();
        }, 300);
      } else if (noteSubmissionFetcher.data.error) {
        addToast(noteSubmissionFetcher.data.error, "error", 3000);
      }
      setLastSubmitTime(0);
    }
    prevSubmitFetcherStateRef.current = noteSubmissionFetcher.state;
  }, [
    noteSubmissionFetcher.state,
    noteSubmissionFetcher.data,
    addToast,
    isNew,
    onCancel,
    lastSubmitTime,
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
    setLastSubmitTime(Date.now());
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

  const isSubmitting = noteSubmissionFetcher.state === "submitting";

  const handleFontSizeChange = (size: number) => {
    const updatedPreferences = { ...editorPreferences, fontSize: size };
    setEditorPreferences(updatedPreferences);
    saveEditorPreferences(updatedPreferences);
  };

  const handleTabSizeChange = (size: 2 | 4 | 8) => {
    const updatedPreferences = { ...editorPreferences, tabSize: size };
    setEditorPreferences(updatedPreferences);
    saveEditorPreferences(updatedPreferences);
  };

  const handleLineWrappingChange = (enabled: boolean) => {
    const updatedPreferences = {
      ...editorPreferences,
      lineWrapping: enabled,
    };
    setEditorPreferences(updatedPreferences);
    saveEditorPreferences(updatedPreferences);
  };

  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        handleSubmit(e);
      }}
      className="flex flex-col h-full space-y-6"
    >
      {/* Title Section */}
      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <label
            htmlFor="note-title"
            className="block text-xs font-semibold uppercase tracking-wide text-gray-600 dark:text-gray-400"
          >
            Title
          </label>
          {/* Auto-save Status Indicator */}
          {!isNew && (
            <div className="flex items-center gap-1.5 text-xs">
              {autoSaveState.status === "saving" && (
                <div className="flex items-center gap-1 text-gray-500 dark:text-gray-400">
                  <svg
                    className="h-3 w-3 animate-spin"
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
                  <span>Saving...</span>
                </div>
              )}
              {autoSaveState.status === "saved" && !autoSaveState.hasUnsavedChanges && (
                <div className="flex items-center gap-1 text-green-600 dark:text-green-400">
                  <CheckIcon className="h-3 w-3" />
                  <span>Saved</span>
                </div>
              )}
              {autoSaveState.hasUnsavedChanges && autoSaveState.status !== "saving" && (
                <div className="flex items-center gap-1 text-amber-600 dark:text-amber-400">
                  <div className="h-2 w-2 rounded-full bg-amber-600 dark:bg-amber-400"></div>
                  <span>Unsaved</span>
                </div>
              )}
              {autoSaveState.status === "error" && (
                <div className="flex items-center gap-1 text-red-600 dark:text-red-400" title={autoSaveState.error || ""}>
                  <ExclamationTriangleIcon className="h-3 w-3" />
                  <span>Save failed</span>
                </div>
              )}
            </div>
          )}
        </div>
        <div className="flex gap-2.5">
          <input
            id="note-title"
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            disabled={isSubmitting}
            className="flex-1 px-3 py-2.5 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 text-gray-900 dark:text-gray-100 rounded-lg shadow-sm focus:ring-2 focus:ring-gray-400 dark:focus:ring-gray-600 focus:border-transparent transition-all duration-150"
            placeholder="Enter note title"
            autoFocus
          />
          <button
            type="button"
            onClick={handleGenerateTitle}
            disabled={isGeneratingTitle || isSubmitting}
            title="Generate title from content using AI"
            aria-label="Generate title from content"
            className="flex-shrink-0 px-3 py-2.5 rounded-lg bg-gray-900 dark:bg-gray-800 text-white dark:text-gray-100 font-medium hover:bg-gray-800 dark:hover:bg-gray-700 disabled:opacity-50 disabled:cursor-not-allowed focus:outline-none focus:ring-2 focus:ring-gray-400 dark:focus:ring-gray-600 transition-all duration-150 min-h-[40px]"
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

      {/* Content Section */}
      <div className="flex-grow flex flex-col space-y-2 min-h-0">
        <div className="flex items-center justify-between">
          <label
            htmlFor="note-content"
            className="block text-xs font-semibold uppercase tracking-wide text-gray-600 dark:text-gray-400"
          >
            Content
          </label>
          {!isMobileEditor && (
            <button
              type="button"
              onClick={() => setShowPreview(!showPreview)}
              title={showPreview ? "Hide preview" : "Show preview"}
              aria-label={showPreview ? "Hide preview" : "Show preview"}
              className="p-1.5 rounded-lg text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-800 focus:outline-none focus:ring-2 focus:ring-gray-400 dark:focus:ring-gray-600 transition-colors duration-150"
            >
              {showPreview ? (
                <EyeSlashIcon className="h-4 w-4" />
              ) : (
                <EyeIcon className="h-4 w-4" />
              )}
            </button>
          )}
        </div>
        <div className="flex-grow flex flex-col min-h-0 border border-gray-300 dark:border-gray-600 rounded-lg shadow-sm overflow-hidden focus-within:ring-2 focus-within:ring-gray-400 dark:focus-within:ring-gray-600">
          <SplitViewContainer
            leftPane={
              <div className="flex flex-col h-full w-full">
                <EditorSettings
                  preferences={editorPreferences}
                  onFontSizeChange={handleFontSizeChange}
                  onTabSizeChange={handleTabSizeChange}
                  onLineWrappingChange={handleLineWrappingChange}
                />
                <AdvancedNoteEditor
                  value={content}
                  onChange={setContent}
                  disabled={isSubmitting}
                  fontSize={editorPreferences.fontSize}
                  lineWrapping={editorPreferences.lineWrapping}
                  tabSize={editorPreferences.tabSize}
                />
              </div>
            }
            rightPane={
              <MarkdownPreviewPane
                content={content}
                fontSize={editorPreferences.fontSize}
              />
            }
            dividerPosition={50}
            showRightPane={!isMobileEditor && showPreview}
          />
        </div>
      </div>

      {/* Folder Section */}
      <div className="space-y-2">
        <label
          htmlFor="note-folder"
          className="block text-xs font-semibold uppercase tracking-wide text-gray-600 dark:text-gray-400"
        >
          Folder
        </label>
        <select
          id="note-folder"
          value={selectedFolder ?? ""}
          onChange={(e) =>
            setSelectedFolder(e.target.value ? parseInt(e.target.value) : null)
          }
          disabled={isSubmitting}
          className="w-full px-3 py-2.5 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 text-gray-900 dark:text-gray-100 rounded-lg shadow-sm focus:ring-2 focus:ring-gray-400 dark:focus:ring-gray-600 focus:border-transparent transition-all duration-150"
        >
          <option value="">No Folder</option>
          {folders.map((folder) => (
            <option key={folder.id} value={folder.id}>
              {folder.name}
            </option>
          ))}
        </select>
      </div>

      {/* Action Buttons */}
      <div className="flex items-center justify-end gap-3 pt-3 border-t border-gray-200 dark:border-gray-700">
        <button
          type="button"
          onClick={onCancel}
          disabled={isSubmitting}
          className="px-4 py-2.5 rounded-lg bg-gray-200 dark:bg-gray-700 text-gray-900 dark:text-gray-100 font-medium hover:bg-gray-300 dark:hover:bg-gray-600 disabled:opacity-50 disabled:cursor-not-allowed focus:outline-none focus:ring-2 focus:ring-gray-400 dark:focus:ring-gray-600 transition-all duration-150 min-h-[40px]"
        >
          Cancel
        </button>
        <button
          type="submit"
          disabled={(!isNew && !hasChanges) || isSubmitting}
          className="px-4 py-2.5 rounded-lg bg-gray-900 dark:bg-gray-800 text-white dark:text-gray-100 font-medium hover:bg-gray-800 dark:hover:bg-gray-700 disabled:opacity-50 disabled:cursor-not-allowed focus:outline-none focus:ring-2 focus:ring-gray-400 dark:focus:ring-gray-600 transition-all duration-150 min-h-[40px] flex items-center gap-2 shadow-sm"
        >
          {isSubmitting && (
            <svg
              className="h-4 w-4 animate-spin"
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
          )}
          {isSubmitting
            ? isNew
              ? "Creating..."
              : "Saving..."
            : isNew
              ? "Create Note"
              : "Save Changes"}
        </button>
      </div>
    </form>
  );
}
