-- Migration: Add dashboard preferences to users table
-- Date: 2025-11-02
-- Description: Add dashboardPreferences JSON field to support personalized dashboard configuration

ALTER TABLE users ADD COLUMN dashboard_preferences jsonb;

-- Create index for faster queries if preferences are used in filtering
CREATE INDEX idx_users_dashboard_preferences ON users USING GIN(dashboard_preferences);
