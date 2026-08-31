-- Migration: Add per-user navigation preferences to users table
-- Date: 2026-08-31
-- Description: Add navigationPreferences JSON field so users can customize
--              their navigation — starting with the pages pinned to the
--              mobile bottom tab bar. Shape and validation live in
--              app/modules/navigation.ts; preferences are never an
--              authorization path (always intersected with accessible pages).

ALTER TABLE users ADD COLUMN IF NOT EXISTS navigation_preferences jsonb;
