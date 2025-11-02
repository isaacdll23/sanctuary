-- Drop redundant viewStartTime and viewEndTime from day_plans
-- Calendar view times are now managed globally via calendarPreferencesTable
ALTER TABLE day_plans DROP COLUMN viewStartTime;
ALTER TABLE day_plans DROP COLUMN viewEndTime;
