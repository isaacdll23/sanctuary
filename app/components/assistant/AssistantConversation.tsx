import { useEffect, useRef } from "react";
import ReactMarkdown from "react-markdown";
import {
  CheckCircleIcon,
  ExclamationTriangleIcon,
} from "@heroicons/react/24/outline";
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
                  if (receipt.ok) {
                    return (
                      <div
                        key={key}
                        className="flex items-start gap-2.5 rounded-xl border border-emerald-500/25 bg-emerald-500/[0.07] px-3 py-2 text-xs"
                      >
                        <CheckCircleIcon
                          aria-hidden="true"
                          className="mt-0.5 h-4 w-4 shrink-0 text-emerald-400"
                        />
                        <div className="min-w-0">
                          <p className="font-medium text-emerald-100">
                            {receipt.label}
                          </p>
                          {receipt.detail && (
                            <p className="text-emerald-100/70">
                              {receipt.detail}
                            </p>
                          )}
                          <p className="mt-0.5 text-emerald-100/60">
                            {receipt.message}
                          </p>
                        </div>
                      </div>
                    );
                  }
                  return (
                    <div
                      key={key}
                      role="alert"
                      className="flex items-start gap-2.5 rounded-xl border border-red-500/30 bg-red-500/10 px-3 py-2 text-xs"
                    >
                      <ExclamationTriangleIcon
                        aria-hidden="true"
                        className="mt-0.5 h-4 w-4 shrink-0 text-red-300"
                      />
                      <p className="text-red-100">{receipt.error}</p>
                    </div>
                  );
                }

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
