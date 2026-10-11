import {
  createAgentUIStreamResponse,
  generateId,
  safeValidateUIMessages,
  type InferAgentUIMessage,
} from "ai";
import type { Route } from "./+types/chat";
import { getLanguageModel, isAiConfigured } from "~/modules/ai.server";
import { requirePageAccess } from "~/modules/middleware/pageAccess";
import { createAssistantAgent } from "~/modules/assistant/agent.server";
import { chatRequestSchema } from "~/modules/assistant/conversation";
import {
  recordAssistantMessage,
  recordUserTurn,
} from "~/modules/services/AssistantConversationService";

function methodNotAllowed() {
  return new Response("Method Not Allowed", {
    status: 405,
    headers: { Allow: "POST" },
  });
}

/**
 * The chat transport uses the response body verbatim as the error message, so
 * these are plain text rather than JSON to keep the UI banner readable.
 */
function errorResponse(message: string, status: number) {
  return new Response(message, {
    status,
    headers: { "Content-Type": "text/plain; charset=utf-8" },
  });
}

export async function loader() {
  return methodNotAllowed();
}

export async function action({ request }: Route.ActionArgs) {
  if (request.method !== "POST") return methodNotAllowed();

  let user;
  try {
    user = await requirePageAccess(request, "assistant");
  } catch (error) {
    // A thrown redirect becomes a 302 that the chat transport cannot parse as
    // a stream; answer JSON so the UI can prompt the user to sign in again.
    if (error instanceof Response && error.status >= 300 && error.status < 400) {
      return errorResponse("Your session has expired. Please sign in again.", 401);
    }
    throw error;
  }

  if (!isAiConfigured()) {
    return errorResponse("The assistant is not configured.", 503);
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    body = null;
  }

  const parsed = chatRequestSchema.safeParse(body);
  if (!parsed.success) {
    return errorResponse("Invalid chat request.", 400);
  }

  // Validate against the agent's own message type so the stream options below
  // stay type-compatible with the tools the agent exposes.
  type AssistantUIMessage = InferAgentUIMessage<
    ReturnType<typeof createAssistantAgent>
  >;
  const validated = await safeValidateUIMessages<AssistantUIMessage>({
    messages: parsed.data.messages,
  });
  if (!validated.success) {
    return errorResponse("Invalid chat messages.", 400);
  }

  const { conversationId } = parsed.data;

  // Save the user's turn before streaming so it survives a stopped or failed
  // response. Ownership is enforced here; the assistant turn below reuses the
  // already-authorized conversation.
  const recorded = await recordUserTurn(user.id, conversationId, validated.data);
  if (!recorded.ok) {
    return errorResponse("Conversation not found.", 404);
  }

  const agent = createAssistantAgent({
    userId: user.id,
    timeZone: user.timeZone,
    model: await getLanguageModel("assistant"),
    now: new Date(),
  });

  return createAgentUIStreamResponse({
    agent,
    uiMessages: validated.data,
    // Persistence mode: reuse the trailing assistant id on a continuation, and
    // otherwise mint a fresh id so each reply is stored as its own row.
    originalMessages: validated.data,
    generateMessageId: generateId,
    abortSignal: request.signal,
    onEnd: async ({ responseMessage }) => {
      try {
        await recordAssistantMessage(conversationId, responseMessage);
      } catch (error) {
        // The response has already streamed; log rather than break the stream.
        console.error("Failed to persist assistant message:", error);
      }
    },
  });
}
