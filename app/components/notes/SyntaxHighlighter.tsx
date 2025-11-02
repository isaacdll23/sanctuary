import { useMemo } from "react";
import { highlightSyntax, getTokenClass } from "~/utils/syntaxHighlighting";

interface SyntaxHighlighterProps {
  content: string;
  fontSize: number;
  lineWrapping: boolean;
  tabSize: number;
}

export function SyntaxHighlighter({
  content,
  fontSize,
  lineWrapping,
  tabSize,
}: SyntaxHighlighterProps) {
  const tokens = useMemo(() => highlightSyntax(content), [content]);

  // Split content into lines for rendering
  const lines = content.split("\n");

  return (
    <div
      className="absolute inset-0 pointer-events-none overflow-hidden whitespace-pre-wrap break-words font-mono text-transparent"
      style={{
        fontSize: `${fontSize}px`,
        lineHeight: `${fontSize * 1.5}px`,
        whiteSpace: lineWrapping ? "pre-wrap" : "pre",
        wordWrap: lineWrapping ? "break-word" : "normal",
        overflowX: lineWrapping ? "hidden" : "auto",
        tabSize: tabSize,
        padding: "calc(0.625rem + 3px) 0.75rem",
      }}
    >
      {/* Render each token with its color class */}
      {tokens.length > 0 ? (
        tokens.map((token, idx) => (
          <span key={idx} className={getTokenClass(token.type)}>
            {content.substring(token.start, token.end)}
          </span>
        ))
      ) : (
        <span>{content}</span>
      )}
    </div>
  );
}
