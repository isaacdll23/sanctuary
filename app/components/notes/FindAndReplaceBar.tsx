import { useState, useEffect, useRef } from "react";
import {
  XMarkIcon,
  ChevronUpIcon,
  ChevronDownIcon,
  ArrowsRightLeftIcon,
} from "@heroicons/react/24/outline";

interface FindAndReplaceBarProps {
  isOpen: boolean;
  onClose: () => void;
  content: string;
  onReplace?: (oldText: string, newText: string, all?: boolean) => void;
}

interface SearchMatch {
  start: number;
  end: number;
  text: string;
}

export function FindAndReplaceBar({
  isOpen,
  onClose,
  content,
  onReplace,
}: FindAndReplaceBarProps) {
  const [searchTerm, setSearchTerm] = useState("");
  const [replaceTerm, setReplaceTerm] = useState("");
  const [currentMatchIndex, setCurrentMatchIndex] = useState(0);
  const [showReplace, setShowReplace] = useState(false);
  const searchInputRef = useRef<HTMLInputElement>(null);
  const replaceInputRef = useRef<HTMLInputElement>(null);

  // Find all matches
  const matches: SearchMatch[] = searchTerm
    ? (() => {
        const regex = new RegExp(
          searchTerm.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"),
          "gi"
        );
        const results: SearchMatch[] = [];
        let match;

        while ((match = regex.exec(content)) !== null) {
          results.push({
            start: match.index,
            end: match.index + match[0].length,
            text: match[0],
          });
        }

        return results;
      })()
    : [];

  // Focus search input when opened
  useEffect(() => {
    if (isOpen && searchInputRef.current) {
      searchInputRef.current.focus();
      searchInputRef.current.select();
    }
  }, [isOpen]);

  // Reset match index when search term changes
  useEffect(() => {
    setCurrentMatchIndex(0);
  }, [searchTerm]);

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Escape") {
      onClose();
    } else if (e.key === "Enter") {
      if (e.shiftKey) {
        goToPreviousMatch();
      } else {
        goToNextMatch();
      }
    }
  };

  const goToNextMatch = () => {
    if (matches.length === 0) return;
    setCurrentMatchIndex((prev) => (prev + 1) % matches.length);
  };

  const goToPreviousMatch = () => {
    if (matches.length === 0) return;
    setCurrentMatchIndex((prev) => (prev - 1 + matches.length) % matches.length);
  };

  const handleReplace = () => {
    if (!onReplace || matches.length === 0) return;
    const match = matches[currentMatchIndex];
    onReplace(match.text, replaceTerm, false);
  };

  const handleReplaceAll = () => {
    if (!onReplace || matches.length === 0) return;
    const match = matches[0];
    onReplace(match.text, replaceTerm, true);
  };

  if (!isOpen) return null;

  return (
    <div className="border-b border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 p-3 space-y-3">
      {/* Search Row */}
      <div className="flex items-center gap-2">
        <input
          ref={searchInputRef}
          type="text"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="Find..."
          className="flex-1 px-3 py-2 text-sm bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 text-gray-900 dark:text-gray-100 rounded focus:outline-none focus:ring-2 focus:ring-gray-400 dark:focus:ring-gray-600"
        />

        {/* Match Counter */}
        {searchTerm && (
          <span className="text-xs font-mono text-gray-600 dark:text-gray-400 min-w-fit px-2">
            {matches.length > 0
              ? `${currentMatchIndex + 1}/${matches.length}`
              : "No results"}
          </span>
        )}

        {/* Navigation Buttons */}
        <button
          type="button"
          onClick={goToPreviousMatch}
          disabled={matches.length === 0}
          title="Previous match (Shift+Enter)"
          className="p-2 rounded hover:bg-gray-200 dark:hover:bg-gray-700 disabled:opacity-50 disabled:cursor-not-allowed focus:outline-none focus:ring-2 focus:ring-gray-400 dark:focus:ring-gray-600 transition-all duration-150"
        >
          <ChevronUpIcon className="h-4 w-4 text-gray-600 dark:text-gray-400" />
        </button>

        <button
          type="button"
          onClick={goToNextMatch}
          disabled={matches.length === 0}
          title="Next match (Enter)"
          className="p-2 rounded hover:bg-gray-200 dark:hover:bg-gray-700 disabled:opacity-50 disabled:cursor-not-allowed focus:outline-none focus:ring-2 focus:ring-gray-400 dark:focus:ring-gray-600 transition-all duration-150"
        >
          <ChevronDownIcon className="h-4 w-4 text-gray-600 dark:text-gray-400" />
        </button>

        {/* Toggle Replace */}
        <button
          type="button"
          onClick={() => setShowReplace(!showReplace)}
          title="Toggle replace"
          className="p-2 rounded hover:bg-gray-200 dark:hover:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-gray-400 dark:focus:ring-gray-600 transition-all duration-150"
        >
          <ArrowsRightLeftIcon className="h-4 w-4 text-gray-600 dark:text-gray-400" />
        </button>

        {/* Close Button */}
        <button
          type="button"
          onClick={onClose}
          title="Close (Escape)"
          className="p-2 rounded hover:bg-gray-200 dark:hover:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-gray-400 dark:focus:ring-gray-600 transition-all duration-150"
        >
          <XMarkIcon className="h-4 w-4 text-gray-600 dark:text-gray-400" />
        </button>
      </div>

      {/* Replace Row */}
      {showReplace && (
        <div className="flex items-center gap-2">
          <input
            ref={replaceInputRef}
            type="text"
            value={replaceTerm}
            onChange={(e) => setReplaceTerm(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Replace..."
            className="flex-1 px-3 py-2 text-sm bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 text-gray-900 dark:text-gray-100 rounded focus:outline-none focus:ring-2 focus:ring-gray-400 dark:focus:ring-gray-600"
          />

          {/* Replace Button */}
          <button
            type="button"
            onClick={handleReplace}
            disabled={matches.length === 0 || !onReplace}
            title="Replace current"
            className="px-3 py-2 text-sm rounded bg-gray-200 dark:bg-gray-700 hover:bg-gray-300 dark:hover:bg-gray-600 disabled:opacity-50 disabled:cursor-not-allowed focus:outline-none focus:ring-2 focus:ring-gray-400 dark:focus:ring-gray-600 transition-all duration-150 text-gray-900 dark:text-gray-100 font-medium"
          >
            Replace
          </button>

          {/* Replace All Button */}
          <button
            type="button"
            onClick={handleReplaceAll}
            disabled={matches.length === 0 || !onReplace}
            title="Replace all"
            className="px-3 py-2 text-sm rounded bg-gray-200 dark:bg-gray-700 hover:bg-gray-300 dark:hover:bg-gray-600 disabled:opacity-50 disabled:cursor-not-allowed focus:outline-none focus:ring-2 focus:ring-gray-400 dark:focus:ring-gray-600 transition-all duration-150 text-gray-900 dark:text-gray-100 font-medium"
          >
            Replace All
          </button>
        </div>
      )}
    </div>
  );
}
