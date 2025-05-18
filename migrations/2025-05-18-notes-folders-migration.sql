-- Migration: Rename principles table to notes, add folders table, and add folderId to notes

ALTER TABLE principles RENAME TO notes;

CREATE TABLE folders (
  id SERIAL PRIMARY KEY,
  user_id INTEGER NOT NULL REFERENCES users(id),
  name VARCHAR(255) NOT NULL,
  created_at TIMESTAMP DEFAULT NOW() NOT NULL
);

ALTER TABLE notes ADD COLUMN folder_id INTEGER REFERENCES folders(id);

-- Existing principles become notes with no folder
-- No data migration needed for folder_id (will be NULL by default)
