-- Migration: Persist assistant chat sessions
-- Date: 2026-10-11
-- Description: Add tables backing the Assistant's persisted conversations so a
--              chat survives reloads and can be listed, reopened, renamed, and
--              deleted like a typical chat app. `assistant_conversations.id` is
--              a client-generated opaque string; access is always scoped by
--              `user_id`, never by the id alone. Messages cascade with their
--              conversation. This mirrors app/db/schema.ts (the deploy migrate
--              step runs drizzle-kit push, so this file documents the change).

CREATE TABLE IF NOT EXISTS assistant_conversations (
  id varchar(64) PRIMARY KEY,
  user_id integer NOT NULL,
  title varchar(255) NOT NULL DEFAULT 'New chat',
  created_at timestamp NOT NULL DEFAULT now(),
  updated_at timestamp NOT NULL DEFAULT now(),
  CONSTRAINT assistant_conversations_user_id_users_id_fk
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS assistant_conversations_user_updated_idx
  ON assistant_conversations (user_id, updated_at);

CREATE TABLE IF NOT EXISTS assistant_messages (
  id integer PRIMARY KEY GENERATED ALWAYS AS IDENTITY,
  conversation_id varchar(64) NOT NULL,
  message_id varchar(64) NOT NULL,
  role varchar(20) NOT NULL,
  parts jsonb NOT NULL,
  created_at timestamp NOT NULL DEFAULT now(),
  CONSTRAINT assistant_messages_conversation_id_fk
    FOREIGN KEY (conversation_id) REFERENCES assistant_conversations(id) ON DELETE CASCADE,
  CONSTRAINT assistant_messages_conversation_message_unique
    UNIQUE (conversation_id, message_id)
);

CREATE INDEX IF NOT EXISTS assistant_messages_conversation_idx
  ON assistant_messages (conversation_id, created_at, id);
