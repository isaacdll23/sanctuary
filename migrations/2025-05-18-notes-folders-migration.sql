-- Migration: Rename principles table to notes, add folders table, and add folderId to notes

ALTER TABLE principles RENAME TO notes;

CREATE TABLE folders (
  id SERIAL PRIMARY KEY,
  userId INTEGER NOT NULL REFERENCES users(id),
  name VARCHAR(255) NOT NULL,
  createdAt TIMESTAMP DEFAULT NOW() NOT NULL
);

ALTER TABLE notes ADD COLUMN folderId INTEGER REFERENCES folders(id);

-- Existing principles become notes with no folder
-- No data migration needed for folder_id (will be NULL by default)
