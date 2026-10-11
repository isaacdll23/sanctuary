import { useEffect, useRef } from "react";
import ReactMarkdown from "react-markdown";
import {
  getToolName,
  isToolUIPart,
  type ChatStatus,
  type UIMessage,
} from "ai";

/** Friendly labels for the assistant's read tools. */
const TOOL_LABELS: Record<string, string> = {
  get_income_overview: "Reading your income",
  list_expenses: "Reading your expenses",
  get_expense_summary: "Summarizing your expenses",
};

interface AssistantConversationProps {
  messages: UIMessage[];
  status: ChatStatus;
}

function toolLabel(toolName: string): string {
  return TOOL_LABELS[toolName] ?? toolName.replaceAll("_", " ");
}

export function AssistantConversation({
  messages,
  status,
}: AssistantConversationProps) {
  const endRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    endRef.current?.scrollIntoView({ block: "end" });
  }, [messages]);

  return (
    <section
      className="flex min-h-0 flex-1 flex-col gap-6 overflow-y-auto"
      aria-label="Conversation"
    >
      {messages.map((message) => (
        <article
          key={message.id}
          className={message.role === "user" ? "flex justify-end" : "flex justify-start"}
        >
          <div
            className={
              message.role === "user"
                ? "max-w-[85%] rounded-2xl rounded-br-sm bg-indigo-600/90 px-4 py-2.5 text-sm text-white"
                : "max-w-full space-y-3 text-sm text-gray-200"
            }
          >
            <h2 className="sr-only">
              {message.role === "user" ? "You" : "Assistant"}
            </h2>
            {message.parts.map((part, index) => {
              const key = `${message.id}-${index}`;

              if (part.type === "text") {
                if (message.role === "user") {
                  return (
                    <p key={key} className="whitespace-pre-wrap">
                      {part.text}
                    </p>
                  );
                }
                return (
                  <div
                    key={key}
                    className="prose prose-sm prose-invert max-w-none prose-p:my-2 prose-pre:my-2 prose-ul:my-2 prose-ol:my-2"
                  >
                    <ReactMarkdown>{part.text}</ReactMarkdown>
                  </div>
                );
              }

              if (isToolUIPart(part)) {
                const label = toolLabel(getToolName(part));
                const failed = part.state === "output-error";
                const done = part.state === "output-available";
                return (
                  <p
                    key={key}
                    className="inline-flex items-center gap-2 rounded-full border border-white/[0.08] bg-zinc-900/60 px-3 py-1 text-xs text-gray-400"
                  >
                    <span
                      aria-hidden="true"
                      className={
                        failed
                          ? "h-1.5 w-1.5 rounded-full bg-red-400"
                          : done
                            ? "h-1.5 w-1.5 rounded-full bg-emerald-400"
                            : "h-1.5 w-1.5 animate-pulse rounded-full bg-indigo-400"
                      }
                    />
                    {failed ? `Couldn't finish: ${label}` : label}
                    {!failed && !done && <span className="text-gray-500">working…</span>}
                  </p>
                );
              }

              return null;
            })}
          </div>
        </article>
      ))}

      {status === "submitted" && (
        <p
          className="flex items-center gap-2 text-xs text-gray-500"
          role="status"
        >
          <span
            aria-hidden="true"
            className="h-1.5 w-1.5 animate-pulse rounded-full bg-indigo-400"
          />
          Thinking…
        </p>
      )}

      <div ref={endRef} />
    </section>
  );
}
