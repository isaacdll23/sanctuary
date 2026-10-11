import { useChat } from "@ai-sdk/react";
import { DefaultChatTransport } from "ai";
import type { Route } from "./+types/assistant";
import { pageAccessLoader } from "~/modules/middleware/pageAccess";
import { isAiConfigured } from "~/modules/ai.server";
import { AssistantHeader } from "~/components/assistant/AssistantHeader";
import { AssistantEmptyState } from "~/components/assistant/AssistantEmptyState";
import { AssistantConversation } from "~/components/assistant/AssistantConversation";
import { AssistantComposer } from "~/components/assistant/AssistantComposer";

export function meta({}: Route.MetaArgs) {
  return [{ title: "Assistant" }];
}

export const loader = pageAccessLoader("assistant", async () => ({
  aiConfigured: isAiConfigured(),
}));

/** Stateless transport config; safe to share across renders. */
const transport = new DefaultChatTransport({ api: "/assistant/chat" });

export default function Assistant({ loaderData }: Route.ComponentProps) {
  const { messages, sendMessage, status, error, stop, clearError } = useChat({
    transport,
  });
  const isBusy = status === "submitted" || status === "streaming";
  const hasConversation = messages.length > 0;

  return (
    <div className="flex h-full flex-col bg-transparent text-gray-100">
      <AssistantHeader />

      <div className="mx-auto flex min-h-0 w-full max-w-4xl flex-1 flex-col px-4 py-6 md:px-8">
        {hasConversation ? (
          <AssistantConversation messages={messages} status={status} />
        ) : (
          <AssistantEmptyState
            onSelect={(text) => sendMessage({ text })}
            disabled={!loaderData.aiConfigured || isBusy}
          />
        )}

        {error && (
          <div
            role="alert"
            className="mt-4 flex items-start justify-between gap-3 rounded-xl border border-red-500/30 bg-red-500/10 px-3 py-2 text-sm text-red-200"
          >
            <p>
              {error.message || "Something went wrong. Please try again."}
            </p>
            <button
              type="button"
              onClick={clearError}
              className="shrink-0 rounded-md px-2 py-0.5 text-xs font-medium text-red-200 hover:bg-red-500/20 focus:outline-none focus-visible:ring-2 focus-visible:ring-red-400"
            >
              Dismiss
            </button>
          </div>
        )}

        <AssistantComposer
          onSend={(text) => sendMessage({ text })}
          onStop={stop}
          isBusy={isBusy}
          disabled={!loaderData.aiConfigured}
          disabledReason={
            loaderData.aiConfigured
              ? undefined
              : "The assistant is not configured. Set OPENAI_API_KEY to enable it."
          }
        />
      </div>
    </div>
  );
}
