/**
 * Basic syntax highlighting for various formats
 * Returns HTML with semantic color classes for styling
 */

export type SyntaxToken = {
  type:
    | "text"
    | "markdown-heading"
    | "markdown-bold"
    | "markdown-italic"
    | "markdown-code"
    | "markdown-link"
    | "code-string"
    | "code-number"
    | "code-comment"
    | "code-keyword"
    | "html-tag"
    | "html-attribute"
    | "json-key"
    | "json-string"
    | "json-number"
    | "json-boolean";
  content: string;
  start: number;
  end: number;
};

/**
 * Highlight Markdown syntax
 */
function highlightMarkdown(text: string): SyntaxToken[] {
  const tokens: SyntaxToken[] = [];
  let i = 0;

  while (i < text.length) {
    // Headings: # ## ### etc
    if (text[i] === "#" && (i === 0 || text[i - 1] === "\n")) {
      const start = i;
      while (i < text.length && text[i] === "#") i++;
      if (i < text.length && text[i] === " ") {
        const lineEnd = text.indexOf("\n", i);
        const end = lineEnd === -1 ? text.length : lineEnd;
        tokens.push({
          type: "markdown-heading",
          content: text.substring(start, end),
          start,
          end,
        });
        i = end;
        continue;
      }
    }

    // Bold: **text**
    if (text[i] === "*" && text[i + 1] === "*") {
      const start = i;
      i += 2;
      let end = text.indexOf("**", i);
      if (end !== -1) {
        tokens.push({
          type: "markdown-bold",
          content: text.substring(start, end + 2),
          start,
          end: end + 2,
        });
        i = end + 2;
        continue;
      }
    }

    // Italic: *text*
    if (text[i] === "*" && text[i + 1] !== "*") {
      const start = i;
      i++;
      let end = text.indexOf("*", i);
      if (end !== -1 && text[end - 1] !== "*") {
        tokens.push({
          type: "markdown-italic",
          content: text.substring(start, end + 1),
          start,
          end: end + 1,
        });
        i = end + 1;
        continue;
      }
    }

    // Inline code: `text`
    if (text[i] === "`") {
      const start = i;
      i++;
      let end = text.indexOf("`", i);
      if (end !== -1) {
        tokens.push({
          type: "markdown-code",
          content: text.substring(start, end + 1),
          start,
          end: end + 1,
        });
        i = end + 1;
        continue;
      }
    }

    // Links: [text](url)
    if (text[i] === "[") {
      const start = i;
      let closeBracket = text.indexOf("]", i);
      if (closeBracket !== -1 && text[closeBracket + 1] === "(") {
        let closeParen = text.indexOf(")", closeBracket + 2);
        if (closeParen !== -1) {
          tokens.push({
            type: "markdown-link",
            content: text.substring(start, closeParen + 1),
            start,
            end: closeParen + 1,
          });
          i = closeParen + 1;
          continue;
        }
      }
    }

    i++;
  }

  return tokens;
}

/**
 * Highlight JSON syntax
 */
function highlightJSON(text: string): SyntaxToken[] {
  const tokens: SyntaxToken[] = [];
  let i = 0;

  while (i < text.length) {
    const char = text[i];

    // Skip whitespace
    if (/\s/.test(char)) {
      i++;
      continue;
    }

    // Strings
    if (char === '"') {
      const start = i;
      i++;
      while (i < text.length && text[i] !== '"') {
        if (text[i] === "\\") i++;
        i++;
      }
      if (i < text.length) i++;

      const content = text.substring(start, i);
      // Check if this is a key (followed by :)
      let j = i;
      while (j < text.length && /\s/.test(text[j])) j++;

      if (text[j] === ":") {
        tokens.push({
          type: "json-key",
          content,
          start,
          end: i,
        });
      } else {
        tokens.push({
          type: "json-string",
          content,
          start,
          end: i,
        });
      }
      continue;
    }

    // Numbers
    if (/[-\d]/.test(char)) {
      const start = i;
      if (text[i] === "-") i++;
      while (i < text.length && /[\d.]/.test(text[i])) i++;

      // Check for scientific notation
      if (i < text.length && /[eE]/.test(text[i])) {
        i++;
        if (text[i] === "-" || text[i] === "+") i++;
        while (i < text.length && /\d/.test(text[i])) i++;
      }

      tokens.push({
        type: "json-number",
        content: text.substring(start, i),
        start,
        end: i,
      });
      continue;
    }

    // Booleans and null
    if (text.substring(i, i + 4) === "true") {
      tokens.push({
        type: "json-boolean",
        content: "true",
        start: i,
        end: i + 4,
      });
      i += 4;
      continue;
    }
    if (text.substring(i, i + 5) === "false") {
      tokens.push({
        type: "json-boolean",
        content: "false",
        start: i,
        end: i + 5,
      });
      i += 5;
      continue;
    }
    if (text.substring(i, i + 4) === "null") {
      tokens.push({
        type: "json-boolean",
        content: "null",
        start: i,
        end: i + 4,
      });
      i += 4;
      continue;
    }

    i++;
  }

  return tokens;
}

/**
 * Highlight code syntax (basic patterns)
 */
function highlightCode(text: string): SyntaxToken[] {
  const tokens: SyntaxToken[] = [];
  let i = 0;

  const keywords = /\b(function|const|let|var|if|else|for|while|return|class|import|export|async|await|try|catch|throw|new|this|super|extends|implements|interface|type|enum|namespace)\b/g;

  // Keywords
  let match;
  while ((match = keywords.exec(text)) !== null) {
    tokens.push({
      type: "code-keyword",
      content: match[0],
      start: match.index,
      end: match.index + match[0].length,
    });
  }

  // Comments: // and /* */
  while (i < text.length) {
    // Line comment
    if (text[i] === "/" && text[i + 1] === "/") {
      const start = i;
      const end = text.indexOf("\n", i);
      const commentEnd = end === -1 ? text.length : end;
      tokens.push({
        type: "code-comment",
        content: text.substring(start, commentEnd),
        start,
        end: commentEnd,
      });
      i = commentEnd;
      continue;
    }

    // Block comment
    if (text[i] === "/" && text[i + 1] === "*") {
      const start = i;
      const end = text.indexOf("*/", i);
      const commentEnd = end === -1 ? text.length : end + 2;
      tokens.push({
        type: "code-comment",
        content: text.substring(start, commentEnd),
        start,
        end: commentEnd,
      });
      i = commentEnd;
      continue;
    }

    // Strings
    if (text[i] === '"' || text[i] === "'" || text[i] === "`") {
      const quote = text[i];
      const start = i;
      i++;
      while (i < text.length && text[i] !== quote) {
        if (text[i] === "\\") i++;
        i++;
      }
      if (i < text.length) i++;

      tokens.push({
        type: "code-string",
        content: text.substring(start, i),
        start,
        end: i,
      });
      continue;
    }

    // Numbers
    if (/\d/.test(text[i])) {
      const start = i;
      while (i < text.length && /[\d.]/.test(text[i])) i++;
      tokens.push({
        type: "code-number",
        content: text.substring(start, i),
        start,
        end: i,
      });
      continue;
    }

    i++;
  }

  return tokens;
}

/**
 * Detect content type and apply appropriate highlighting
 */
export function highlightSyntax(text: string): SyntaxToken[] {
  // Try to detect JSON
  const trimmed = text.trim();
  if ((trimmed.startsWith("{") || trimmed.startsWith("[")) && trimmed.endsWith("}") || trimmed.endsWith("]")) {
    try {
      JSON.parse(trimmed);
      return highlightJSON(text);
    } catch {
      // Not valid JSON, continue
    }
  }

  // Check for code patterns
  const hasCodePatterns =
    /\b(function|const|let|var|if|else|for|while|class|import|export)\b/.test(
      text
    ) || /(\/\/|\/\*|\*\/)/.test(text);

  if (hasCodePatterns) {
    return highlightCode(text);
  }

  // Check for markdown
  if (/(^|\n)#+\s|(\*{2}|_{2}).+\2|\[.+\]\(.+\)|\n-\s|\n\d+\.\s/.test(text)) {
    return highlightMarkdown(text);
  }

  // Default: basic markdown highlighting
  return highlightMarkdown(text);
}

/**
 * Get CSS class for syntax token type
 */
export function getTokenClass(type: SyntaxToken["type"]): string {
  const classMap: Record<SyntaxToken["type"], string> = {
    "markdown-heading": "font-bold text-blue-600 dark:text-blue-400",
    "markdown-bold": "font-bold text-gray-900 dark:text-gray-100",
    "markdown-italic": "italic text-gray-700 dark:text-gray-300",
    "markdown-code":
      "bg-gray-100 dark:bg-gray-800 text-red-600 dark:text-red-400 rounded px-1",
    "markdown-link": "text-blue-600 dark:text-blue-400 underline",
    "code-keyword": "font-semibold text-purple-600 dark:text-purple-400",
    "code-string": "text-green-600 dark:text-green-400",
    "code-number": "text-orange-600 dark:text-orange-400",
    "code-comment":
      "italic text-gray-500 dark:text-gray-400",
    "html-tag": "text-red-600 dark:text-red-400",
    "html-attribute": "text-yellow-600 dark:text-yellow-400",
    "json-key": "text-blue-600 dark:text-blue-400 font-semibold",
    "json-string": "text-green-600 dark:text-green-400",
    "json-number": "text-orange-600 dark:text-orange-400",
    "json-boolean": "text-purple-600 dark:text-purple-400 font-semibold",
    text: "",
  };

  return classMap[type] || "";
}
