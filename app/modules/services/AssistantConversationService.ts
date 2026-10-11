import { and, asc, desc, eq, sql } from "drizzle-orm";
import { safeValidateUIMessages, type UIMessage } from "ai";
import { db } from "~/db";
import {
  assistantConversationsTable,
  assistantMessagesTable,
} from "~/db/schema";
import { deriveConversationTitle } from "~/modules/assistant/conversation";

export interface AssistantConversationSummary {
  id: string;
  title: string;
}

export interface AssistantConversationDetail {
  id: string;
  title: string;
  messages: UIMessage[];
}

export type RecordUserTurnResult =
  | { ok: true }
  | { ok: false; reason: "forbidden" };

/** Conversation list for the sidebar, most recently active first. */
export async function listConversations(
  userId: number
): Promise<AssistantConversationSummary[]> {
  return db
    .select({
      id: assistantConversationsTable.id,
      title: assistantConversationsTable.title,
    })
    .from(assistantConversationsTable)
    .where(eq(assistantConversationsTable.userId, userId))
    .orderBy(desc(assistantConversationsTable.updatedAt));
}

/** Loads a conversation and its message history, scoped to the owner. */
export async function getConversation(
  userId: number,
  conversationId: string
): Promise<AssistantConversationDetail | null> {
  const [conversation] = await db
    .select({
      id: assistantConversationsTable.id,
      title: assistantConversationsTable.title,
    })
    .from(assistantConversationsTable)
    .where(
      and(
        eq(assistantConversationsTable.id, conversationId),
        eq(assistantConversationsTable.userId, userId)
      )
    )
    .limit(1);

  if (!conversation) return null;

  const rows = await db
    .select({
      messageId: assistantMessagesTable.messageId,
      role: assistantMessagesTable.role,
      parts: assistantMessagesTable.parts,
    })
    .from(assistantMessagesTable)
    .where(eq(assistantMessagesTable.conversationId, conversationId))
    .orderBy(
      asc(assistantMessagesTable.createdAt),
      asc(assistantMessagesTable.id)
    );

  // `parts` is untyped JSON in the database; validate before handing it to the
  // client so a malformed row degrades to an empty thread rather than crashing.
  const validated = await safeValidateUIMessages({
    messages: rows.map((row) => ({
      id: row.messageId,
      role: row.role,
      parts: row.parts,
    })),
  });

  return {
    id: conversation.id,
    title: conversation.title,
    messages: validated.success ? validated.data : [],
  };
}

/**
 * Persists a user turn. Creates the conversation on first write (deriving its
 * title from the prompt) and upserts every incoming message so a stopped or
 * failed stream still leaves the user's message saved. Returns `forbidden`
 * rather than leaking another user's conversation existence.
 */
export async function recordUserTurn(
  userId: number,
  conversationId: string,
  messages: UIMessage[]
): Promise<RecordUserTurnResult> {
  const [existing] = await db
    .select({ userId: assistantConversationsTable.userId })
    .from(assistantConversationsTable)
    .where(eq(assistantConversationsTable.id, conversationId))
    .limit(1);

  if (existing) {
    if (existing.userId !== userId) return { ok: false, reason: "forbidden" };
  } else {
    await db
      .insert(assistantConversationsTable)
      .values({
        id: conversationId,
        userId,
        title: deriveConversationTitle(messages),
      })
      .onConflictDoNothing({ target: assistantConversationsTable.id });

    // A concurrent request could have claimed the id for another user.
    const [claimed] = await db
      .select({ userId: assistantConversationsTable.userId })
      .from(assistantConversationsTable)
      .where(eq(assistantConversationsTable.id, conversationId))
      .limit(1);
    if (!claimed || claimed.userId !== userId) {
      return { ok: false, reason: "forbidden" };
    }
  }

  await upsertMessages(conversationId, messages);
  await touchConversation(conversationId);
  return { ok: true };
}

/** Persists the assistant's streamed reply (including partial/aborted output). */
export async function recordAssistantMessage(
  conversationId: string,
  message: UIMessage
): Promise<void> {
  if (message.parts.length === 0) return;
  await upsertMessages(conversationId, [message]);
  await touchConversation(conversationId);
}

export async function renameConversation(
  userId: number,
  conversationId: string,
  title: string
): Promise<boolean> {
  const updated = await db
    .update(assistantConversationsTable)
    .set({ title, updatedAt: new Date() })
    .where(
      and(
        eq(assistantConversationsTable.id, conversationId),
        eq(assistantConversationsTable.userId, userId)
      )
    )
    .returning({ id: assistantConversationsTable.id });

  return updated.length > 0;
}

export async function deleteConversation(
  userId: number,
  conversationId: string
): Promise<boolean> {
  const deleted = await db
    .delete(assistantConversationsTable)
    .where(
      and(
        eq(assistantConversationsTable.id, conversationId),
        eq(assistantConversationsTable.userId, userId)
      )
    )
    .returning({ id: assistantConversationsTable.id });

  return deleted.length > 0;
}

/**
 * Idempotent message write. The SDK reuses message ids for continuations, so an
 * upsert keyed on `(conversationId, messageId)` replaces the row instead of
 * duplicating it on regenerate or a retried stream.
 */
async function upsertMessages(
  conversationId: string,
  messages: UIMessage[]
): Promise<void> {
  if (messages.length === 0) return;

  await db
    .insert(assistantMessagesTable)
    .values(
      messages.map((message) => ({
        conversationId,
        messageId: message.id,
        role: message.role,
        parts: message.parts,
      }))
    )
    .onConflictDoUpdate({
      target: [
        assistantMessagesTable.conversationId,
        assistantMessagesTable.messageId,
      ],
      set: {
        role: sql`excluded.role`,
        parts: sql`excluded.parts`,
      },
    });
}

async function touchConversation(conversationId: string): Promise<void> {
  await db
    .update(assistantConversationsTable)
    .set({ updatedAt: new Date() })
    .where(eq(assistantConversationsTable.id, conversationId));
}
