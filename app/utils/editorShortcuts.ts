/**
 * Types for editor text manipulation operations
 */

export interface TextSelection {
  start: number;
  end: number;
}

export interface TextOperation {
  type: "insert" | "delete" | "replace";
  position: number;
  oldText?: string;
  newText?: string;
}

/**
 * Get current line number from cursor position
 */
export function getLineNumber(text: string, position: number): number {
  return text.substring(0, position).split("\n").length;
}

/**
 * Get start position of current line
 */
export function getLineStart(text: string, position: number): number {
  const lineStart = text.lastIndexOf("\n", position - 1) + 1;
  return lineStart;
}

/**
 * Get end position of current line
 */
export function getLineEnd(text: string, position: number): number {
  const lineEnd = text.indexOf("\n", position);
  return lineEnd === -1 ? text.length : lineEnd;
}

/**
 * Get text of current line
 */
export function getCurrentLine(text: string, position: number): string {
  const start = getLineStart(text, position);
  const end = getLineEnd(text, position);
  return text.substring(start, end);
}

/**
 * Get indentation level of current line (in spaces)
 */
export function getLineIndentation(text: string, position: number): string {
  const line = getCurrentLine(text, position);
  const match = line.match(/^(\s*)/);
  return match ? match[1] : "";
}

/**
 * Duplicate current line and insert below
 */
export function duplicateLine(text: string, position: number): TextOperation {
  const lineStart = getLineStart(text, position);
  const lineEnd = getLineEnd(text, position);
  const line = text.substring(lineStart, lineEnd);
  const newlineChar = text[lineEnd] === "\n" ? "\n" : "";
  const insertText = newlineChar + line;
  
  return {
    type: "insert",
    position: lineEnd,
    newText: insertText,
  };
}

/**
 * Delete entire current line
 */
export function deleteLine(text: string, position: number): TextOperation {
  const lineStart = getLineStart(text, position);
  const lineEnd = getLineEnd(text, position);
  const deleteEnd = text[lineEnd] === "\n" ? lineEnd + 1 : lineEnd;
  
  return {
    type: "delete",
    position: lineStart,
    oldText: text.substring(lineStart, deleteEnd),
  };
}

/**
 * Move current line up
 */
export function moveLineUp(text: string, position: number): TextOperation | null {
  const lineStart = getLineStart(text, position);
  
  // If already at first line, can't move up
  if (lineStart === 0) {
    return null;
  }
  
  // Find previous line
  const prevLineEnd = lineStart - 1;
  const prevLineStart = text.lastIndexOf("\n", prevLineEnd - 1) + 1;
  
  // Get both lines with their line endings
  const currentLineEnd = getLineEnd(text, position);
  const currentLineEndWithNewline = text[currentLineEnd] === "\n" ? currentLineEnd + 1 : currentLineEnd;
  
  const currentLine = text.substring(lineStart, currentLineEndWithNewline);
  const prevLine = text.substring(prevLineStart, lineStart);
  
  // Swap lines
  const newText = prevLine + currentLine + text.substring(prevLineStart, lineStart).replace(prevLine, "");
  const before = text.substring(0, prevLineStart);
  const after = text.substring(currentLineEndWithNewline);
  const swapped = before + currentLine + prevLine + after;
  
  return {
    type: "replace",
    position: prevLineStart,
    oldText: text.substring(prevLineStart, currentLineEndWithNewline),
    newText: currentLine + prevLine,
  };
}

/**
 * Move current line down
 */
export function moveLineDown(text: string, position: number): TextOperation | null {
  const lineStart = getLineStart(text, position);
  const lineEnd = getLineEnd(text, position);
  const lineEndWithNewline = text[lineEnd] === "\n" ? lineEnd + 1 : lineEnd;
  
  // If already at last line, can't move down
  if (lineEndWithNewline >= text.length) {
    return null;
  }
  
  // Find next line
  const nextLineStart = lineEndWithNewline;
  const nextLineEnd = text.indexOf("\n", nextLineStart);
  const nextLineEndWithNewline = nextLineEnd === -1 ? text.length : nextLineEnd + 1;
  
  const currentLine = text.substring(lineStart, lineEndWithNewline);
  const nextLine = text.substring(nextLineStart, nextLineEndWithNewline);
  
  return {
    type: "replace",
    position: lineStart,
    oldText: text.substring(lineStart, nextLineEndWithNewline),
    newText: nextLine + currentLine,
  };
}

/**
 * Toggle comment on current line(s)
 * For Markdown/general text, uses "# " as comment
 */
export function toggleComment(
  text: string,
  selectionStart: number,
  selectionEnd: number,
  commentChar: string = "#"
): TextOperation | null {
  const isMultiline = selectionStart !== selectionEnd;
  
  if (!isMultiline) {
    // Single line: toggle comment on current line
    const lineStart = getLineStart(text, selectionStart);
    const line = getCurrentLine(text, selectionStart);
    const commentPrefix = `${commentChar} `;
    
    if (line.trimStart().startsWith(commentPrefix)) {
      // Remove comment
      const trimmed = line.trimStart();
      const removed = trimmed.substring(commentPrefix.length);
      const indent = line.substring(0, line.indexOf(trimmed));
      const newLine = indent + removed;
      
      return {
        type: "replace",
        position: lineStart,
        oldText: line,
        newText: newLine,
      };
    } else {
      // Add comment
      const indent = line.match(/^(\s*)/)?.[1] || "";
      const content = line.substring(indent.length);
      const newLine = indent + commentPrefix + content;
      
      return {
        type: "replace",
        position: lineStart,
        oldText: line,
        newText: newLine,
      };
    }
  }
  
  // Multi-line: toggle comment on all selected lines
  const lineStart = getLineStart(text, selectionStart);
  const lineEndPos = getLineEnd(text, selectionEnd);
  const selectedText = text.substring(lineStart, lineEndPos);
  
  const lines = selectedText.split("\n");
  const allCommented = lines.every((line) =>
    line.length === 0 || line.trimStart().startsWith(`${commentChar} `)
  );
  
  const toggledLines = lines.map((line) => {
    if (line.length === 0) return line;
    
    const commentPrefix = `${commentChar} `;
    const trimmed = line.trimStart();
    const indent = line.substring(0, line.indexOf(trimmed) || 0);
    
    if (allCommented && trimmed.startsWith(commentPrefix)) {
      return indent + trimmed.substring(commentPrefix.length);
    } else if (!allCommented && !trimmed.startsWith(commentPrefix)) {
      return indent + commentPrefix + trimmed;
    }
    return line;
  });
  
  return {
    type: "replace",
    position: lineStart,
    oldText: selectedText,
    newText: toggledLines.join("\n"),
  };
}

/**
 * Check if a keyboard event matches a shortcut
 */
export function isShortcut(
  event: KeyboardEvent | React.KeyboardEvent<HTMLTextAreaElement>,
  key: string,
  ctrl = false,
  shift = false,
  alt = false
): boolean {
  const isMac = typeof navigator !== "undefined" && /Mac|iPhone|iPad|iPod/.test(navigator.platform);
  const modifier = isMac ? event.metaKey : event.ctrlKey;
  
  return (
    event.key.toLowerCase() === key.toLowerCase() &&
    modifier === ctrl &&
    event.shiftKey === shift &&
    event.altKey === alt
  );
}
