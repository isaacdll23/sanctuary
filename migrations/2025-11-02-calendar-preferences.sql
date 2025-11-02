-- Migration: Add calendar preferences table
-- Date: 2025-11-02

-- Create calendar_preferences table for user-configurable calendar view times
CREATE TABLE calendar_preferences (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id INTEGER NOT NULL UNIQUE REFERENCES users(id),
  calendar_view_start_time TIME NOT NULL DEFAULT '06:00:00',
  calendar_view_end_time TIME NOT NULL DEFAULT '22:00:00',
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- Create index for faster lookups
CREATE INDEX idx_calendar_preferences_user_id ON calendar_preferences(user_id);
