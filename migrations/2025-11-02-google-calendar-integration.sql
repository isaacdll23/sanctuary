-- Migration: Add Google Calendar integration tables and update users table
-- Date: 2025-11-02

-- 1. Add columns to users table for Google Calendar preferences
ALTER TABLE users
ADD COLUMN google_calendar_connected INTEGER NOT NULL DEFAULT 0,
ADD COLUMN google_calendar_preferences JSON;

-- 2. Create enum types for Google Calendar
CREATE TYPE google_calendar_sync_direction AS ENUM ('pull-only', 'push-only', 'bidirectional');
CREATE TYPE google_calendar_sync_status AS ENUM ('synced', 'pending', 'conflict');
CREATE TYPE google_calendar_conflict_resolution AS ENUM ('local-wins', 'remote-wins', 'manual');

-- 3. Create google_calendar_accounts table
CREATE TABLE google_calendar_accounts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id INTEGER NOT NULL UNIQUE REFERENCES users(id),
  google_account_email VARCHAR(255) NOT NULL,
  google_calendar_id VARCHAR(255) NOT NULL,
  access_token VARCHAR(2048) NOT NULL,
  refresh_token VARCHAR(2048) NOT NULL,
  token_expires_at TIMESTAMP NOT NULL,
  is_sync_enabled INTEGER NOT NULL DEFAULT 1,
  sync_direction google_calendar_sync_direction NOT NULL DEFAULT 'bidirectional',
  last_sync_at TIMESTAMP,
  connected_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  disconnected_at TIMESTAMP,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- 4. Create day_planner_google_sync_mapping table
CREATE TABLE day_planner_google_sync_mapping (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id INTEGER NOT NULL REFERENCES users(id),
  day_plan_section_id UUID NOT NULL REFERENCES day_plan_sections(id),
  google_event_id VARCHAR(255) NOT NULL,
  google_calendar_id VARCHAR(255) NOT NULL,
  local_last_modified TIMESTAMP,
  google_last_modified TIMESTAMP,
  sync_status google_calendar_sync_status NOT NULL DEFAULT 'synced',
  conflict_resolution google_calendar_conflict_resolution,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- 5. Create indexes for performance
CREATE INDEX idx_google_calendar_accounts_user_id ON google_calendar_accounts(user_id);
CREATE INDEX idx_day_planner_google_sync_mapping_user_id ON day_planner_google_sync_mapping(user_id);
CREATE INDEX idx_day_planner_google_sync_mapping_day_plan_section_id ON day_planner_google_sync_mapping(day_plan_section_id);
