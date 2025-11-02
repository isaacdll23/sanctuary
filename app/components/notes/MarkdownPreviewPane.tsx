import React from "react";
import ReactMarkdown from "react-markdown";

interface MarkdownPreviewPaneProps {
  content: string;
  fontSize?: number;
}

export function MarkdownPreviewPane({
  content,
  fontSize = 14,
}: MarkdownPreviewPaneProps) {
  return (
    <div
      className="flex-grow overflow-y-auto bg-gray-50 dark:bg-gray-800 p-6 border-l border-gray-200 dark:border-gray-700"
      style={{
        fontSize: `${fontSize}px`,
      }}
    >
      <div className="prose prose-gray dark:prose-invert prose-sm md:prose-base max-w-none">
        {content.trim() ? (
          <ReactMarkdown>{content}</ReactMarkdown>
        ) : (
          <p className="text-gray-500 dark:text-gray-400 italic">
            Preview will appear here as you type...
          </p>
        )}
      </div>
    </div>
  );
}
