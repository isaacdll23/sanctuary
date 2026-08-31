-- Migration: Add per-user feature overrides to users table
-- Date: 2026-08-31
-- Description: Add featureOverrides JSON field so individual users can enable
--              or disable optional features for themselves. Resolution rule:
--              user override wins, otherwise the platform default applies
--              (see app/modules/featureFlags.ts).

ALTER TABLE users ADD COLUMN IF NOT EXISTS feature_overrides jsonb;
