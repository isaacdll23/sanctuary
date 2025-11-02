# Google Calendar Integration - Quick Start Guide

## Setup Instructions

### 1. Generate Encryption Key

```bash
node -e "console.log(require('crypto').randomBytes(32).toString('base64'))"
```

Save the output - you'll need it in the next step.

### 2. Set Environment Variables

Create or update your `.env.local` file:

```env
# Google OAuth Credentials
GOOGLE_CLIENT_ID=<your-client-id>.apps.googleusercontent.com
GOOGLE_CLIENT_SECRET=<your-client-secret>
GOOGLE_REDIRECT_URI=http://localhost:5173/auth/google/callback

# Token Encryption
TOKEN_ENCRYPTION_KEY=<the-key-you-generated-above>
```

### 3. Get Google OAuth Credentials

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Create a new project (e.g., "Sanctuary")
3. Enable the Google Calendar API:
   - Search for "Google Calendar API"
   - Click "Enable"
4. Create OAuth 2.0 credentials:
   - Go to "Credentials" in the sidebar
   - Click "Create Credentials" > "OAuth 2.0 Client ID"
   - Choose "Web application"
   - Name: "Sanctuary"
   - Authorized JavaScript origins: `http://localhost:5173`
   - Authorized redirect URIs: `http://localhost:5173/auth/google/callback`
   - Click Create
5. Copy the Client ID and Client Secret to your `.env.local`

### 4. Apply Database Migration

```bash
npx drizzle-kit push
```

This will:
- Add columns to the `users` table
- Create enum types for sync control
- Create `google_calendar_accounts` table
- Create `day_planner_google_sync_mapping` table
- Create performance indexes

### 5. Start Development Server

```bash
npm run dev
```

### 6. Test the OAuth Flow

1. Navigate to http://localhost:5173
2. Login with your test account
3. Once Phase 4 is complete, go to `/profile/calendar-settings`
4. Click "Connect Google Calendar"
5. You'll be redirected to Google's consent screen
6. After authorizing, you should be redirected back with a success message

## File Reference

### Core Files
- `app/db/schema.ts` - Database schema with new Google Calendar tables
- `app/modules/auth.server.ts` - OAuth functions
- `app/modules/services/TokenEncryptionService.ts` - Token encryption/decryption
- `app/modules/services/GoogleCalendarApiClient.ts` - Google Calendar API client
- `app/routes/auth/google/callback.tsx` - OAuth callback handler
- `app/routes.ts` - Route definitions

### Migration
- `migrations/2025-11-02-google-calendar-integration.sql` - Database migration

### Documentation
- `GOOGLE_CALENDAR_PHASE_1_2_IMPLEMENTATION.md` - Detailed implementation docs

## API Scopes

The integration uses these minimal scopes:
- `https://www.googleapis.com/auth/calendar` - Read/write calendar settings
- `https://www.googleapis.com/auth/calendar.events` - Read/write events

## Token Security

- All tokens are encrypted at rest using AES-256-GCM
- Tokens are stored in the `google_calendar_accounts` table
- Tokens are decrypted only when needed for API calls
- Encryption key is never logged or exposed

## Troubleshooting

### Environment Variables Not Loaded
- Make sure `.env.local` is in the root directory
- Restart the dev server after editing `.env.local`
- Check that there are no spaces around the `=` sign

### "Google OAuth credentials not configured"
- Verify all three Google environment variables are set
- Check `.env.local` has the correct values
- Restart dev server

### Database Migration Failed
- Ensure PostgreSQL is running
- Check database connection string
- Run `npx drizzle-kit push` with verbose output for details

### "No refresh token in Google OAuth response"
- This means the user denied the OAuth consent
- The integration forces a new consent prompt each time (safe for dev)
- Try again with a different Google account if testing

## Production Deployment

### Environment Variables
1. Set all Google OAuth environment variables in your hosting platform
2. Generate a new `TOKEN_ENCRYPTION_KEY` for production
3. Update `GOOGLE_REDIRECT_URI` to your production domain

### Database
1. Run migrations on your production database
2. Verify the new tables were created correctly

### Security
- Enable HTTPS (already enforced in `sessions.server.ts`)
- Use strong, unique `TOKEN_ENCRYPTION_KEY`
- Regularly rotate OAuth credentials
- Monitor failed sync attempts

## Next Phase

Once all phases are complete, users will be able to:
- ✅ Connect their Google Calendar (Phase 2 ✅)
- ⏳ Sync tasks bidirectionally (Phase 3)
- ⏳ Manage sync settings (Phase 4)
- ⏳ Handle conflicts automatically (Phase 5)
- ⏳ View Google Calendar events in Day Planner (Phase 4+)

See `GOOGLE_CALENDAR_INTEGRATION_PLAN.md` for the full roadmap.
