-- Migration: Add encryption support to notes table
-- Adds isEncrypted flag and encryptionMetadata column for note content encryption

ALTER TABLE notes ADD COLUMN IF NOT EXISTS "isEncrypted" integer DEFAULT 0 NOT NULL;
ALTER TABLE notes ADD COLUMN IF NOT EXISTS "encryptionMetadata" json;

-- Set all existing notes to unencrypted (0) to maintain backward compatibility
UPDATE notes SET "isEncrypted" = 0 WHERE "isEncrypted" IS NULL;
