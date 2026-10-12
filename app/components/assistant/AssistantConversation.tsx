import { useEffect, useRef, useState } from "react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import {
  BeakerIcon,
  CheckCircleIcon,
  CheckIcon,
  ChevronDownIcon,
  ClipboardIcon,
  ExclamationTriangleIcon,
} from "@heroicons/react/24/outline";
import {
  getToolName,
  isReasoningUIPart,
  isToolUIPart,
  type ChatStatus,
  type UIMessage,
} from "ai";
import { hasReasoningText } from "./reasoning";

/** Friendly labels for the assistant's read tools. */
const TOOL_LABELS: Record<string, string> = {
  get_income_overview: "Reading your income",
  list_expenses: "Reading your expenses",
  get_expense_summary: "Summarizing your expenses",
  list_payment_accounts: "Reading your accounts",
  get_balance_summary: "Checking your balance",
  get_upcoming_cash_flow: "Reviewing upcoming bills",
  create_expense: "Adding an expense",
  update_expense: "Updating an expense",
  set_expense_active: "Updating an expense",
  delete_expense: "Deleting an expense",
  record_expense_charge: "Recording a payment",
  remove_expense_charge: "Undoing a payment",
  log_account_balance: "Logging a balance",
  create_payment_account: "Adding an account",
  delete_payment_account: "Deleting an account",
  update_income: "Updating your income",
};

/** Tools that change data and therefore render a confirmation receipt. */
const WRITE_TOOLS = new Set([
  "create_expense",
  "update_expense",
  "set_expense_active",
  "delete_expense",
  "record_expense_charge",
  "remove_expense_charge",
  "log_account_balance",
  "create_payment_account",
  "delete_payment_account",
  "update_income",
]);

interface WriteSuccessReceipt {
  ok: true;
  label: string;
  detail?: string;
  message: string;
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null;
}

/** Reads the write-tool result envelope from a streamed tool part. */
function readWriteReceipt(
  output: unknown
): WriteSuccessReceipt | { ok: false; error: string } | null {
  if (!isRecord(output) || typeof output.ok !== "boolean") return null;
  if (!output.ok) {
    return {
      ok: false,
      error:
        typeof output.error === "string"
          ? output.error
          : "The change could not be completed.",
    };
  }

  const entity = isRecord(output.entity) ? output.entity : null;
  if (
    !entity ||
    typeof entity.label !== "string" ||
    typeof output.message !== "string"
  ) {
    return null;
  }

  return {
    ok: true,
    label: entity.label,
    detail: typeof entity.detail === "string" ? entity.detail : undefined,
    message: output.message,
  };
}

interface AssistantConversationProps {
  messages: UIMessage[];
  status: ChatStatus;
}

function toolLabel(toolName: string): string {
  return TOOL_LABELS[toolName] ?? toolName.replaceAll("_", " ");
}

/** Reads the plain text of a message so it can be copied to the clipboard. */
function messageText(message: UIMessage): string {
  return message.parts
    .flatMap((part) => (part.type === "text" ? [part.text] : []))
    .join("\n\n")
    .trim();
}

/** Tool activity shown before/while a tool runs, or for read-only tools. */
function ToolActivity({
  label,
  failed,
  done,
}: {
  label: string;
  failed: boolean;
  done: boolean;
}) {
  return (
    <span className="inline-flex items-center gap-2 rounded-full border border-white/[0.1] bg-gray-800/60 px-3 py-1 text-xs font-medium text-gray-200">
      <span
        aria-hidden="true"
        className={
          failed
            ? "h-1.5 w-1.5 shrink-0 rounded-full bg-red-400"
            : done
              ? "h-1.5 w-1.5 shrink-0 rounded-full bg-emerald-400"
              : "h-1.5 w-1.5 shrink-0 animate-pulse rounded-full bg-indigo-400"
        }
      />
      {failed ? `Couldn't finish: ${label}` : label}
      {!failed && !done && (
        <span className="font-normal text-gray-400">working…</span>
      )}
    </span>
  );
}

/** Confirmation card for a write tool that succeeded. */
function WriteSuccess({ receipt }: { receipt: WriteSuccessReceipt }) {
  return (
    <div className="flex items-start gap-3 rounded-xl border border-emerald-400/30 bg-emerald-500/[0.08] px-3.5 py-3 text-sm">
      <CheckCircleIcon
        aria-hidden="true"
        className="mt-0.5 h-4 w-4 shrink-0 text-emerald-400"
      />
      <div className="min-w-0">
        <p className="font-medium text-emerald-900">{receipt.label}</p>
        {receipt.detail && (
          <p className="text-emerald-900/80">{receipt.detail}</p>
        )}
        <p className="mt-0.5 text-emerald-900/70">{receipt.message}</p>
      </div>
    </div>
  );
}

/** Failure card for a write tool that could not complete. */
function WriteFailure({ error }: { error: string }) {
  return (
    <div
      role="alert"
      className="flex items-start gap-3 rounded-xl border border-red-400/35 bg-red-500/10 px-3.5 py-3 text-sm"
    >
      <ExclamationTriangleIcon
        aria-hidden="true"
        className="mt-0.5 h-4 w-4 shrink-0 text-red-400"
      />
      <div className="min-w-0">
        <p className="font-medium text-red-900">Couldn't complete that change</p>
        <p className="text-red-900/80">{error}</p>
      </div>
    </div>
  );
}

/** Collapsible transcript of the model's reasoning, when the provider emits it. */
function ReasoningBlock({
  text,
  streaming,
}: {
  text: string;
  streaming: boolean;
}) {
  return (
    <details className="group rounded-xl border border-violet-400/25 bg-violet-500/[0.06]">
      <summary className="flex cursor-pointer list-none items-center gap-2 px-3 py-2 text-xs font-medium text-violet-200 transition-colors hover:text-violet-100 focus:outline-none focus-visible:ring-2 focus-visible:ring-violet-400/60 [&::-webkit-details-marker]:hidden">
        <BeakerIcon aria-hidden="true" className="h-3.5 w-3.5" />
        {streaming ? "Thinking…" : "Thought process"}
        <ChevronDownIcon
          aria-hidden="true"
          className="ml-auto h-3.5 w-3.5 transition-transform group-open:rotate-180"
        />
      </summary>
      <div className="border-t border-violet-400/15 px-3 py-2 text-xs leading-relaxed whitespace-pre-wrap text-gray-300">
        {text}
      </div>
    </details>
  );
}

/** Copies an assistant reply to the clipboard, with transient confirmation. */
function CopyButton({ text }: { text: string }) {
  const [copied, setCopied] = useState(false);

  async function copy() {
    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 1500);
    } catch {
      // Clipboard access can be denied; leave the control unchanged.
    }
  }

  return (
    <button
      type="button"
      onClick={() => void copy()}
      className="inline-flex items-center gap-1 rounded-md px-1.5 py-0.5 text-[11px] font-medium text-gray-500 transition-colors hover:bg-white/[0.06] hover:text-gray-200 focus:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500"
    >
      {copied ? (
        <CheckIcon aria-hidden="true" className="h-3.5 w-3.5" />
      ) : (
        <ClipboardIcon aria-hidden="true" className="h-3.5 w-3.5" />
      )}
      {copied ? "Copied" : "Copy"}
    </button>
  );
}

export function AssistantConversation({
  messages,
  status,
}: AssistantConversationProps) {
  const endRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    endRef.current?.scrollIntoView({ block: "end" });
  }, [messages]);

  const streaming = status === "streaming";

  return (
    <section
      className="flex min-h-0 flex-1 flex-col gap-6 overflow-y-auto"
      aria-label="Conversation"
    >
      {messages.map((message, messageIndex) => {
        const isLastMessage = messageIndex === messages.length - 1;
        const messageStreaming =
          streaming && isLastMessage && message.role === "assistant";
        const text = message.role === "assistant" ? messageText(message) : "";

        return (
          <article
            key={message.id}
            className={
              message.role === "user" ? "flex justify-end" : "flex justify-start"
            }
          >
            <div
              className={
                message.role === "user"
                  ? "max-w-[85%] rounded-2xl rounded-br-sm bg-indigo-600/90 px-4 py-2.5 text-sm text-white shadow-sm shadow-black/20"
                  : "w-full max-w-3xl space-y-3 text-sm text-gray-200"
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
                  const isLastTextPart =
                    !message.parts
                      .slice(index + 1)
                      .some((candidate) => candidate.type === "text");
                  return (
                    <div
                      key={key}
                      className={[
                        "assistant-prose prose prose-sm prose-invert max-w-none prose-p:my-2 prose-pre:my-2 prose-ul:my-2 prose-ol:my-2 prose-headings:mb-2 prose-headings:mt-4 prose-table:text-sm",
                        messageStreaming && isLastTextPart
                          ? "assistant-prose--streaming"
                          : "",
                      ].join(" ")}
                    >
                      <ReactMarkdown remarkPlugins={[remarkGfm]}>
                        {part.text}
                      </ReactMarkdown>
                    </div>
                  );
                }

                if (isReasoningUIPart(part)) {
                  // Providers can emit a reasoning part that carries only
                  // encrypted state with no summary text; skip it so the block
                  // never renders empty.
                  if (!hasReasoningText(part.text)) return null;

                  return (
                    <ReasoningBlock
                      key={key}
                      text={part.text}
                      streaming={part.state === "streaming"}
                    />
                  );
                }

                if (isToolUIPart(part)) {
                  const toolName = getToolName(part);
                  const label = toolLabel(toolName);
                  const failed = part.state === "output-error";
                  const done = part.state === "output-available";
                  const receipt =
                    part.state === "output-available" &&
                    WRITE_TOOLS.has(toolName)
                      ? readWriteReceipt(part.output)
                      : null;

                  if (receipt) {
                    return receipt.ok ? (
                      <WriteSuccess key={key} receipt={receipt} />
                    ) : (
                      <WriteFailure key={key} error={receipt.error} />
                    );
                  }

                  return (
                    <ToolActivity
                      key={key}
                      label={label}
                      failed={failed}
                      done={done}
                    />
                  );
                }

                return null;
              })}

              {message.role === "assistant" && text && (
                <div className="flex justify-end">
                  <CopyButton text={text} />
                </div>
              )}
            </div>
          </article>
        );
      })}

      {status === "submitted" && (
        <p
          className="flex items-center gap-2 text-xs text-gray-400"
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
