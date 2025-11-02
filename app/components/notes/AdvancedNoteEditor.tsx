import { useRef, useEffect, useState, useCallback } from "react";
import { SyntaxHighlighter } from "./SyntaxHighlighter";
import {
  duplicateLine,
  deleteLine,
  moveLineUp,
  moveLineDown,
  toggleComment,
  getLineStart,
  getLineEnd,
} from "~/utils/editorShortcuts";

interface AdvancedNoteEditorProps {
  value: string;
  onChange: (value: string) => void;
  disabled?: boolean;
  fontSize?: number;
  lineWrapping?: boolean;
  tabSize?: number;
}

export function AdvancedNoteEditor({
  value,
  onChange,
  disabled = false,
  fontSize = 14,
  lineWrapping = true,
  tabSize = 2,
}: AdvancedNoteEditorProps) {
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const lineNumbersRef = useRef<HTMLDivElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const [lineCount, setLineCount] = useState(1);

  // Calculate line count
  useEffect(() => {
    const lines = value.split("\n").length;
    setLineCount(lines);
  }, [value]);

  // Handle scroll synchronization
  const handleScroll = useCallback(() => {
    if (textareaRef.current && lineNumbersRef.current) {
      lineNumbersRef.current.scrollTop = textareaRef.current.scrollTop;
      lineNumbersRef.current.scrollLeft = textareaRef.current.scrollLeft;
    }
  }, []);

  // Generate line number array
  const lineNumbers = Array.from({ length: lineCount }, (_, i) => i + 1);

  // Handle text input
  const handleChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    onChange(e.target.value);
  };

  // Handle tab key for indentation
  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Tab") {
      e.preventDefault();
      const textarea = textareaRef.current;
      if (!textarea) return;

      const start = textarea.selectionStart;
      const end = textarea.selectionEnd;
      const tabString = " ".repeat(tabSize);

      // If text is selected, indent the entire selection
      if (start !== end) {
        const beforeSelection = value.substring(0, start);
        const selectedText = value.substring(start, end);
        const afterSelection = value.substring(end);

        // Check if Shift was pressed for dedent
        if (e.shiftKey) {
          // Dedent: remove one level of indentation from each line
          const dedentedText = selectedText
            .split("\n")
            .map((line) =>
              line.startsWith(tabString) ? line.slice(tabString.length) : line
            )
            .join("\n");
          const newValue =
            beforeSelection + dedentedText + afterSelection;
          onChange(newValue);
          // Restore selection with adjusted position
          setTimeout(() => {
            const dedentOffset = selectedText.length - dedentedText.length;
            textarea.setSelectionRange(start, end - dedentOffset);
          }, 0);
        } else {
          // Indent: add one level of indentation to each line
          const indentedText = selectedText
            .split("\n")
            .map((line) => tabString + line)
            .join("\n");
          const newValue = beforeSelection + indentedText + afterSelection;
          onChange(newValue);
          // Restore selection with adjusted position
          setTimeout(() => {
            const indentOffset = indentedText.length - selectedText.length;
            textarea.setSelectionRange(start + tabSize, end + indentOffset);
          }, 0);
        }
      } else {
        // No selection, just insert tab at cursor
        const newValue = value.substring(0, start) + tabString + value.substring(start);
        onChange(newValue);
        // Move cursor after the inserted tab
        setTimeout(() => {
          textarea.setSelectionRange(start + tabSize, start + tabSize);
        }, 0);
      }
    }
    // Move line up: Alt+Up
    else if (e.altKey && e.key === "ArrowUp") {
      e.preventDefault();
      const textarea = textareaRef.current;
      if (!textarea) return;

      const operation = moveLineUp(value, textarea.selectionStart);
      if (operation) {
        const newValue =
          value.substring(0, operation.position) +
          operation.newText +
          value.substring(operation.position + (operation.oldText?.length || 0));
        onChange(newValue);
        setTimeout(() => {
          const lineStart = getLineStart(newValue, operation.position);
          textarea.setSelectionRange(lineStart, lineStart);
        }, 0);
      }
    }
    // Move line down: Alt+Down
    else if (e.altKey && e.key === "ArrowDown") {
      e.preventDefault();
      const textarea = textareaRef.current;
      if (!textarea) return;

      const operation = moveLineDown(value, textarea.selectionStart);
      if (operation) {
        const newValue =
          value.substring(0, operation.position) +
          operation.newText +
          value.substring(operation.position + (operation.oldText?.length || 0));
        onChange(newValue);
        setTimeout(() => {
          const nextLineStart = getLineEnd(newValue, operation.position) + 1;
          textarea.setSelectionRange(nextLineStart, nextLineStart);
        }, 0);
      }
    }
  };

  return (
    <div
      ref={containerRef}
      className="relative w-full flex-grow flex border border-gray-300 dark:border-gray-600 rounded-lg overflow-hidden shadow-sm bg-white dark:bg-gray-800"
    >
      {/* Syntax Highlighting Layer */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden">
        <SyntaxHighlighter
          content={value}
          fontSize={fontSize}
          lineWrapping={lineWrapping}
          tabSize={tabSize}
        />
      </div>

      {/* Line Numbers Gutter */}
      <div
        ref={lineNumbersRef}
        className="flex-shrink-0 bg-gray-50 dark:bg-gray-800 border-r border-gray-200 dark:border-gray-700 overflow-hidden select-none relative z-10"
        style={{
          width: `${lineCount.toString().length * 8 + 16}px`,
          minWidth: "40px",
        }}
      >
        <div
          className="text-right text-xs text-gray-500 dark:text-gray-500 font-mono pt-2.5"
          style={{
            fontSize: `${fontSize}px`,
            lineHeight: `${fontSize * 1.5}px`,
            paddingRight: "8px",
          }}
        >
          {lineNumbers.map((lineNum) => (
            <div key={lineNum}>{lineNum}</div>
          ))}
        </div>
      </div>

      {/* Textarea */}
      <textarea
        ref={textareaRef}
        value={value}
        onChange={handleChange}
        onScroll={handleScroll}
        onKeyDown={handleKeyDown}
        disabled={disabled}
        className="flex-grow w-full px-3 py-2.5 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 font-mono resize-none focus:outline-none focus:ring-2 focus:ring-inset focus:ring-gray-400 dark:focus:ring-gray-600 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-150 relative z-20"
        style={{
          fontSize: `${fontSize}px`,
          lineHeight: `${fontSize * 1.5}px`,
          whiteSpace: lineWrapping ? "pre-wrap" : "pre",
          wordWrap: lineWrapping ? "break-word" : "normal",
          overflowX: lineWrapping ? "hidden" : "auto",
          tabSize: tabSize,
          WebkitTapHighlightColor: "transparent",
        }}
        placeholder="Enter note content (supports Markdown)"
        rows={15}
      />
    </div>
  );
}
