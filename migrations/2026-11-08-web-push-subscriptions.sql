-- Migration: Web Push subscriptions
-- Date: 2026-11-08
-- Description: Store browser Web Push subscriptions so the server can deliver
--              notifications through the PWA service worker. `endpoint` is
--              unique at the push service, so re-subscribing upserts on it;
--              every read, send, and delete is scoped by `user_id`. Purely
--              additive, so existing rows and tables are unaffected. This
--              mirrors app/db/schema.ts (the production migrate step runs
--              drizzle-kit push, so this file documents the change).

CREATE TABLE IF NOT EXISTS push_subscriptions (
  id integer PRIMARY KEY GENERATED ALWAYS AS IDENTITY,
  user_id integer NOT NULL,
  endpoint varchar(2048) NOT NULL UNIQUE,
  p256dh varchar(255) NOT NULL,
  auth varchar(255) NOT NULL,
  user_agent varchar(512),
  created_at timestamp NOT NULL DEFAULT now(),
  last_used_at timestamp,
  failure_count integer NOT NULL DEFAULT 0,
  CONSTRAINT push_subscriptions_user_id_users_id_fk
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS push_subscriptions_user_idx
  ON push_subscriptions (user_id);
