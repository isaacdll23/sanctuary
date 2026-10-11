import { z } from "zod";
import type { UIMessage } from "ai";

/**
 * Conversation ids are generated on the client (the AI SDK's `generateId`, a
 * 16-char alphanumeric string) so a new chat can be linked before the first
 * response lands. The server still owns authorization: every query is scoped by
 * the authenticated `userId`, so the id only has to be well-formed here.
 */
export const CONVERSATION_ID_PATTERN = /^[A-Za-z0-9_-]+$/;
export const MAX_CONVERSATION_ID_LENGTH = 64;
export const MAX_CONVERSATION_TITLE_LENGTH = 255;

/** Max characters of the first user message kept as the conversation title. */
const TITLE_PREVIEW_LENGTH = 60;

export const chatRequestSchema = z.object({
  conversationId: z
    .string()
    .min(1)
    .max(MAX_CONVERSATION_ID_LENGTH)
    .regex(CONVERSATION_ID_PATTERN),
  messages: z.array(z.unknown()).min(1).max(200),
});

export type ChatRequest = z.infer<typeof chatRequestSchema>;

/**
 * Derives a stable, human-readable title from a conversation's first user
 * message. Deterministic (no extra model call): ChatGPT-style titles are a
 * nicety, but the first prompt is a predictable fallback and never blocks the
 * response.
 */
export function deriveConversationTitle(messages: UIMessage[]): string {
  const firstUser = messages.find((message) => message.role === "user");
  if (!firstUser) return "New chat";

  const text = firstUser.parts
    .flatMap((part) => (part.type === "text" ? [part.text] : []))
    .join(" ")
    .replace(/\s+/g, " ")
    .trim();

  if (!text) return "New chat";
  if (text.length <= TITLE_PREVIEW_LENGTH) return text;

  const truncated = text.slice(0, TITLE_PREVIEW_LENGTH);
  const lastSpace = truncated.lastIndexOf(" ");
  const cut = lastSpace > 30 ? truncated.slice(0, lastSpace) : truncated;
  return `${cut.trimEnd()}…`;
}
