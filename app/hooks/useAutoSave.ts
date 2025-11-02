import { useEffect, useRef, useState, useCallback } from "react";
import { useFetcher } from "react-router";

interface AutoSaveState {
  status: "idle" | "saving" | "saved" | "error";
  lastSavedAt: Date | null;
  error: string | null;
  hasUnsavedChanges: boolean;
}

interface UseAutoSaveOptions {
  debounceMs?: number;
  enabled?: boolean;
  retryAttempts?: number;
  retryDelayMs?: number;
}

/**
 * Custom hook for auto-saving note content with debouncing and error handling
 * Only triggers auto-save for existing notes (not new notes)
 * Automatically retries failed saves with exponential backoff
 */
export function useAutoSave(
  noteId: number | null | undefined,
  title: string,
  content: string,
  folderId: number | null | undefined,
  options: UseAutoSaveOptions = {}
) {
  const {
    debounceMs = 3000,
    enabled = true,
    retryAttempts = 2,
    retryDelayMs = 1000,
  } = options;

  const autoSaveFetcher = useFetcher<any>();
  const debounceTimerRef = useRef<NodeJS.Timeout | null>(null);
  const retryCountRef = useRef(0);
  const hasUnsavedChangesRef = useRef(false);

  const [autoSaveState, setAutoSaveState] = useState<AutoSaveState>({
    status: "idle",
    lastSavedAt: null,
    error: null,
    hasUnsavedChanges: false,
  });

  // Trigger auto-save with debouncing
  const scheduleAutoSave = useCallback(() => {
    if (!enabled || !noteId) {
      return;
    }

    hasUnsavedChangesRef.current = true;

    // Mark as having unsaved changes
    setAutoSaveState((prev) => ({
      ...prev,
      hasUnsavedChanges: true,
    }));

    // Clear existing timer
    if (debounceTimerRef.current) {
      clearTimeout(debounceTimerRef.current);
    }

    // Schedule new save
    debounceTimerRef.current = setTimeout(() => {
      if (!noteId) return;

      setAutoSaveState((prev) => ({
        ...prev,
        status: "saving",
        error: null,
      }));

      autoSaveFetcher.submit(
        {
          intent: "autoSaveNote",
          noteId: noteId.toString(),
          title: title.trim(),
          content: content.trim(),
          folderId: folderId ? folderId.toString() : "",
        },
        { method: "post", action: "/notes" }
      );

      retryCountRef.current = 0;
      hasUnsavedChangesRef.current = false;
    }, debounceMs);
  }, [enabled, noteId, title, content, folderId, debounceMs, autoSaveFetcher]);

  // Handle auto-save response
  useEffect(() => {
    if (autoSaveFetcher.state === "idle" && autoSaveFetcher.data) {
      if (autoSaveFetcher.data.success) {
        setAutoSaveState({
          status: "saved",
          lastSavedAt: new Date(),
          error: null,
          hasUnsavedChanges: false,
        });

        // Clear saved status after 2 seconds
        const timer = setTimeout(() => {
          setAutoSaveState((prev) => ({
            ...prev,
            status: "idle",
          }));
        }, 2000);

        return () => clearTimeout(timer);
      } else if (autoSaveFetcher.data.error) {
        // Retry logic with exponential backoff
        if (retryCountRef.current < retryAttempts && hasUnsavedChangesRef.current) {
          retryCountRef.current += 1;
          const delay = retryDelayMs * Math.pow(2, retryCountRef.current - 1);

          setAutoSaveState((prev) => ({
            ...prev,
            status: "saving",
            error: null,
          }));

          const retryTimer = setTimeout(() => {
            if (!noteId) return;
            autoSaveFetcher.submit(
              {
                intent: "autoSaveNote",
                noteId: noteId.toString(),
                title: title.trim(),
                content: content.trim(),
                folderId: folderId ? folderId.toString() : "",
              },
              { method: "post", action: "/notes" }
            );
          }, delay);

          return () => clearTimeout(retryTimer);
        } else {
          // Max retries exceeded or no unsaved changes
          setAutoSaveState({
            status: "error",
            lastSavedAt: autoSaveState.lastSavedAt,
            error: autoSaveFetcher.data.error,
            hasUnsavedChanges: true,
          });

          // Clear error after 5 seconds
          const errorTimer = setTimeout(() => {
            setAutoSaveState((prev) => ({
              ...prev,
              status: "idle",
              error: null,
            }));
          }, 5000);

          return () => clearTimeout(errorTimer);
        }
      }
    }
  }, [autoSaveFetcher.state, autoSaveFetcher.data, noteId, title, content, folderId, retryAttempts, retryDelayMs, autoSaveState.lastSavedAt]);

  // Cleanup timer on unmount
  useEffect(() => {
    return () => {
      if (debounceTimerRef.current) {
        clearTimeout(debounceTimerRef.current);
      }
    };
  }, []);

  return {
    scheduleAutoSave,
    autoSaveState,
    isAutoSaving: autoSaveFetcher.state === "submitting",
  };
}
