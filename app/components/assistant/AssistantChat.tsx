import { useMemo, useState } from "react";
import { useChat } from "@ai-sdk/react";
import { DefaultChatTransport, generateId, type UIMessage } from "ai";
import { useNavigate, useRevalidator } from "react-router";
import type { ReasoningEffort } from "~/modules/assistant/conversation";
import {
  loadReasoningEffort,
  saveReasoningEffort,
} from "~/utils/assistantPreferences";
import { AssistantHeader } from "./AssistantHeader";
import { AssistantEmptyState } from "./AssistantEmptyState";
import { AssistantConversation } from "./AssistantConversation";
import { AssistantComposer } from "./AssistantComposer";

interface AssistantChatProps {
  /** Existing conversation id, or `null` for a not-yet-saved new chat. */
  conversationId: string | null;
  initialMessages: UIMessage[];
  aiConfigured: boolean;
  title: string;
  onOpenSidebar?: () => void;
}

/**
 * Owns a single chat's client state. The route remounts this component per
 * conversation, so `initialMessages` seeds the thread and `conversationId`
 * identifies where each turn is persisted. For a new chat the id is generated
 * client-side up front, then the URL is updated once the first reply lands.
 */
export function AssistantChat({
  conversationId,
  initialMessages,
  aiConfigured,
  title,
  onOpenSidebar,
}: AssistantChatProps) {
  const navigate = useNavigate();
  const revalidator = useRevalidator();
  const [chatId] = useState(() => conversationId ?? generateId());
  const [reasoningEffort, setReasoningEffort] = useState<ReasoningEffort>(() =>
    loadReasoningEffort()
  );

  const transport = useMemo(
    () =>
      new DefaultChatTransport({
        api: "/assistant/chat",
        body: { conversationId: chatId },
      }),
    [chatId]
  );

  const { messages, sendMessage, status, error, stop, clearError } = useChat({
    id: chatId,
    messages: initialMessages,
    transport,
    onFinish: () => {
      if (!conversationId) {
        // Adopt the saved conversation so reloads and the sidebar point at it.
        navigate(`/assistant/${chatId}`, { replace: true });
      } else {
        // Refresh the sidebar (ordering/title) without resetting this thread.
        revalidator.revalidate();
      }
    },
  });

  const isBusy = status === "submitted" || status === "streaming";
  const hasConversation = messages.length > 0;

  function handleReasoningEffortChange(effort: ReasoningEffort) {
    setReasoningEffort(effort);
    saveReasoningEffort(effort);
  }

  // The effort is sent per message rather than baked into the transport, so a
  // mid-thread change applies to the next reply without recreating the chat.
  function send(text: string) {
    void sendMessage({ text }, { body: { reasoningEffort } });
  }

  return (
    <div className="flex h-full min-h-0 flex-col text-gray-100">
      <AssistantHeader title={title} onOpenSidebar={onOpenSidebar} />

      <div className="mx-auto flex min-h-0 w-full max-w-4xl flex-1 flex-col px-4 py-6 md:px-8">
        {hasConversation ? (
          <AssistantConversation messages={messages} status={status} />
        ) : (
          <AssistantEmptyState
            onSelect={send}
            disabled={!aiConfigured || isBusy}
          />
        )}

        {error && (
          <div
            role="alert"
            className="mt-4 flex items-start justify-between gap-3 rounded-xl border border-red-500/30 bg-red-500/10 px-3 py-2 text-sm text-red-200"
          >
            <p>{error.message || "Something went wrong. Please try again."}</p>
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
          onSend={send}
          onStop={stop}
          isBusy={isBusy}
          reasoningEffort={reasoningEffort}
          onReasoningEffortChange={handleReasoningEffortChange}
          disabled={!aiConfigured}
          disabledReason={
            aiConfigured
              ? undefined
              : "The assistant is not configured. Set OPENAI_API_KEY to enable it."
          }
        />
      </div>
    </div>
  );
}
