# Google Calendar Integration - Quick Reference Guide

## What Was Implemented (Phase 3 & 4)

### New Services
- `GoogleCalendarService.ts` - Complete sync orchestration and business logic

### New Routes
- `/profile/calendar-settings` - Google Calendar connection and preference management

### New Components
- `GoogleCalendarButton.tsx` - Header button for quick access to sync and settings
- `SyncStatusBadge.tsx` - Visual indicator for task sync status
- `ConflictResolutionModal.tsx` - UI for resolving sync conflicts

### Updated Components
- `DayPlannerHeader.tsx` - Now includes GoogleCalendarButton
- `Sidebar.tsx` - Added Calendar Settings navigation link
- `day-planner.tsx` - Integrated Google Calendar sync functionality
- `PageAccessService.ts` - Added calendar-settings to accessible pages

## Key Features

### Calendar Settings Page (`/profile/calendar-settings`)
1. **Connection Management**
   - Connect/Disconnect Google Calendar
   - View connected account email
   - See connection timestamp and last sync time

2. **Sync Configuration**
   - Choose sync direction: bidirectional, pull-only, or push-only
   - Toggle calendar color sync
   - Toggle description inclusion in events

3. **Manual Sync**
   - Sync Now button for immediate synchronization
   - Real-time status updates via toast notifications

### Day Planner Integration
1. **Sync Button in Header**
   - Quick access to sync and settings
   - Status indicator (connected/disconnected)
   - Manual sync trigger

2. **Automatic Sync**
   - When creating tasks (if sync enabled)
   - When editing tasks (if bidirectional sync)
   - When deleting tasks (if synced)

3. **Conflict Detection**
   - Automatically detects conflicting edits
   - Prompts user with ConflictResolutionModal
   - Three resolution strategies: keep local, keep Google, manual edit

## How to Use

### User Flow: Connecting Google Calendar
1. Navigate to `/profile/calendar-settings`
2. Click "Connect Google Calendar"
3. Authorize Google Calendar access
4. Redirected back with success message
5. Configure sync preferences as needed

### User Flow: Manual Sync
1. On Day Planner page (`/day-planner`)
2. Click Google Calendar button in header
3. Select "Sync Now" from dropdown
4. Wait for sync to complete
5. View success toast notification

### User Flow: Resolving Conflicts
1. During bidirectional sync, if conflicts detected
2. Conflict resolution modal appears
3. Review both versions side-by-side
4. Choose resolution strategy:
   - Keep Sanctuary version
   - Keep Google Calendar version
   - Open manual edit modal
5. Conflict marked as resolved

## Developer Reference

### Service Functions (GoogleCalendarService.ts)

```typescript
// Account Management
getGoogleCalendarAccount(userId: number)
isGoogleCalendarConnected(userId: number)
disconnectGoogleCalendar(userId: number)
getValidAccessToken(userId: number)

// Sync Operations
manualSyncGoogleCalendar(userId: number, formData: FormData)
syncGoogleEventsToLocalPlan(userId: number, planDate: string)
syncLocalTasksToGoogle(userId: number, planDate: string)
handleBidirectionalSync(userId: number, planDate: string)

// Conflict Management
detectAndFlagConflicts(userId: number, planDate: string)
resolveSyncConflict(userId: number, formData: FormData)

// Utilities
convertLocalTaskToGoogleEvent(task, planDate, timeZone)
convertGoogleEventToLocalTask(event, planId, userId)
getTaskSyncStatus(userId: number, planDate: string)

// Router
handleGoogleCalendarAction(request: Request)
```

### Form Intents

**Calendar Settings Route (`/profile/calendar-settings`)**
```
disconnectGoogleCalendar
updateSyncPreferences
manualSyncGoogleCalendar
resolveSyncConflict
```

**Day Planner Route (`/day-planner`)**
```
manualSyncGoogleCalendar
resolveSyncConflict
(+ existing day planner intents)
```

### Component Props

**GoogleCalendarButton**
```typescript
interface GoogleCalendarButtonProps {
  isConnected: boolean;
  onManualSync?: () => void;
  isSyncing?: boolean;
}
```

**SyncStatusBadge**
```typescript
interface SyncStatusBadgeProps {
  status: "synced" | "pending" | "conflict" | undefined;
  conflictResolution?: string | null;
  tooltipText?: string;
}
```

**ConflictResolutionModal**
```typescript
interface ConflictResolutionModalProps {
  isOpen: boolean;
  mappingId: string;
  localVersion: TaskData;
  googleVersion: EventData;
  onClose: () => void;
}
```

## Database Tables Used

### Primary Tables
- `google_calendar_accounts` - OAuth tokens and sync settings
- `day_planner_google_sync_mapping` - Task-to-event mappings and sync status

### Related Tables
- `users` - Google connection flags
- `day_plans` - Planning containers
- `day_plan_sections` - Individual tasks

## Page Access Control

**Calendar Settings Page ID:** `"calendar-settings"`
- Available to all authenticated users
- Added to default user access by PageAccessService

**Sidebar Navigation**
- Link appears in Account section
- Uses CalendarIcon from Hero Icons

## Environment Variables Required

These should be set from Phase 2:
```
GOOGLE_CLIENT_ID
GOOGLE_CLIENT_SECRET
GOOGLE_REDIRECT_URI
TOKEN_ENCRYPTION_KEY
```

## Common Workflows

### Adding Sync Status to TaskBlock Component
```tsx
import SyncStatusBadge from "~/components/day-planner/SyncStatusBadge";

// In component render
<SyncStatusBadge 
  status={taskSyncStatus[task.id]?.syncStatus}
  conflictResolution={taskSyncStatus[task.id]?.conflictResolution}
/>
```

### Triggering Manual Sync
```tsx
fetcher.submit(
  {
    intent: "manualSyncGoogleCalendar",
    planDate: new Date().toISOString().split("T")[0],
  },
  { method: "post" }
);
```

### Handling Conflict Resolution
```tsx
fetcher.submit(
  {
    intent: "resolveSyncConflict",
    mappingId: conflictMapping.id,
    resolution: "local-wins", // or "remote-wins" or "manual"
  },
  { method: "post" }
);
```

## Testing Checklist

- [ ] Connect Google Calendar from settings page
- [ ] Verify OAuth redirect works
- [ ] Disconnect Google Calendar
- [ ] Verify disconnection removes access
- [ ] Update sync preferences
- [ ] Trigger manual sync
- [ ] Verify sync status updates
- [ ] Create conflicting edits in both systems
- [ ] Test all three conflict resolution options
- [ ] Verify tasks sync to Google Calendar
- [ ] Verify Google events pull into Day Planner
- [ ] Test bidirectional sync mode
- [ ] Test pull-only sync mode
- [ ] Test push-only sync mode
- [ ] Verify dark mode UI rendering
- [ ] Test mobile responsiveness
- [ ] Verify toast notifications display

## Troubleshooting

### "Google Calendar not connected" error
- Verify user has google_calendar_accounts record
- Check isSyncEnabled flag is 1
- Verify access token is not expired

### Token expiration errors
- Service automatically refreshes expired tokens
- Check TOKEN_ENCRYPTION_KEY is correctly set
- Verify refresh token in database is valid

### Conflict not resolving
- Check mapping exists in day_planner_google_sync_mapping
- Verify both localLastModified and googleLastModified are set
- Review conflict detection logic for edge cases

### Sync not working
- Verify Google OAuth credentials are configured
- Check user has calendar-settings page access
- Review error logs for API errors
- Verify network connectivity to Google APIs

## Next Steps

See `GOOGLE_CALENDAR_PHASE_3_4_IMPLEMENTATION.md` for:
- Complete architecture documentation
- All function implementations
- Security considerations
- Future enhancements

## File Reference

```
app/modules/services/GoogleCalendarService.ts    ← Core service logic
app/routes/profile/calendar-settings.tsx          ← Settings page
app/routes/day-planner/day-planner.tsx           ← Day Planner integration
app/components/day-planner/GoogleCalendarButton.tsx
app/components/day-planner/SyncStatusBadge.tsx
app/components/day-planner/ConflictResolutionModal.tsx
app/components/day-planner/DayPlannerHeader.tsx
app/components/sidebar/Sidebar.tsx
app/modules/services/PageAccessService.ts        ← Updated for page access
```

