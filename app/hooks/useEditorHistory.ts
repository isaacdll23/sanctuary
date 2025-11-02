import { useState, useCallback, useRef } from "react";

interface HistoryEntry {
  content: string;
  cursorPosition: number;
  timestamp: number;
}

export interface UseEditorHistoryReturn {
  canUndo: boolean;
  canRedo: boolean;
  undo: () => { content: string; cursorPosition: number } | null;
  redo: () => { content: string; cursorPosition: number } | null;
  push: (content: string, cursorPosition: number) => void;
  clear: () => void;
}

/**
 * Custom hook for managing editor undo/redo history
 * Maintains a stack-based history with configurable max entries
 */
export function useEditorHistory(maxEntries: number = 100): UseEditorHistoryReturn {
  const [history, setHistory] = useState<HistoryEntry[]>([]);
  const [currentIndex, setCurrentIndex] = useState(-1);
  const debounceTimerRef = useRef<NodeJS.Timeout | null>(null);
  const lastPushTimeRef = useRef(0);

  /**
   * Push a new state to history with debouncing to avoid excessive entries
   * Only adds to history if more than 300ms has passed since last push
   */
  const push = useCallback(
    (content: string, cursorPosition: number) => {
      // Clear any pending debounce
      if (debounceTimerRef.current) {
        clearTimeout(debounceTimerRef.current);
      }

      const now = Date.now();
      const timeSinceLastPush = now - lastPushTimeRef.current;

      // Debounce: only push every 300ms
      if (timeSinceLastPush < 300) {
        debounceTimerRef.current = setTimeout(() => {
          push(content, cursorPosition);
        }, 300 - timeSinceLastPush);
        return;
      }

      lastPushTimeRef.current = now;

      setHistory((prevHistory) => {
        // Remove any entries after current index (when user undoes then makes changes)
        const newHistory = prevHistory.slice(0, currentIndex + 1);

        // Add new entry
        newHistory.push({
          content,
          cursorPosition,
          timestamp: now,
        });

        // Maintain max entries limit
        if (newHistory.length > maxEntries) {
          newHistory.shift();
          return newHistory;
        }

        return newHistory;
      });

      setCurrentIndex((prevIndex) => prevIndex + 1);
    },
    [currentIndex, maxEntries]
  );

  /**
   * Undo to previous state
   */
  const undo = useCallback((): { content: string; cursorPosition: number } | null => {
    if (currentIndex <= 0) return null;

    const newIndex = currentIndex - 1;
    setCurrentIndex(newIndex);

    const entry = history[newIndex];
    return {
      content: entry.content,
      cursorPosition: entry.cursorPosition,
    };
  }, [currentIndex, history]);

  /**
   * Redo to next state
   */
  const redo = useCallback((): { content: string; cursorPosition: number } | null => {
    if (currentIndex >= history.length - 1) return null;

    const newIndex = currentIndex + 1;
    setCurrentIndex(newIndex);

    const entry = history[newIndex];
    return {
      content: entry.content,
      cursorPosition: entry.cursorPosition,
    };
  }, [currentIndex, history]);

  /**
   * Clear all history
   */
  const clear = useCallback(() => {
    setHistory([]);
    setCurrentIndex(-1);
    if (debounceTimerRef.current) {
      clearTimeout(debounceTimerRef.current);
    }
  }, []);

  return {
    canUndo: currentIndex > 0,
    canRedo: currentIndex < history.length - 1,
    undo,
    redo,
    push,
    clear,
  };
}
