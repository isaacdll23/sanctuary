# Web Push Notifications

Sanctuary can deliver Web Push notifications to installed PWA clients through
the existing service worker. This document covers the architecture, VAPID
configuration, iOS constraints, testing, key rotation, and rollback.

Push is **optional**: without VAPID keys the app boots normally,
`isPushConfigured()` returns `false`, and Settings → Notifications reports the
feature as unconfigured. Nothing else in the app depends on it.

## Architecture

| Piece | Location | Responsibility |
| --- | --- | --- |
| Storage | `push_subscriptions` table (`app/db/schema.ts`) | One row per browser subscription. Unique `endpoint`, cascade delete with the user, per-user index, `failure_count`, `last_used_at`. |
| Validation/helpers | `app/modules/push.ts` | Zod schemas for subscriptions and payloads, payload size guard, base64url decoder, push-test throttle decision. Pure and client-safe. |
| Delivery + business logic | `app/modules/services/PushNotificationService.ts` | `isPushConfigured`, `getVapidPublicKey`, save/remove/count subscriptions, `sendPushToUser`, per-user test throttle. Lazily configures `web-push` VAPID details. |
| Settings UI | Settings → Notifications tab (`app/components/settings/PushNotificationsSection.tsx`) | Detects support, iOS install state, permission and subscription state; subscribes/unsubscribes; sends a test. |
| Settings mutations | `app/routes/settings.tsx` action | Intents `pushSubscribe`, `pushUnsubscribe`, `pushTest`, all behind `pageAccessAction("settings")`. |
| Renewal endpoint | `app/routes/push-subscription.ts` (`POST /push/subscription`) | Session-authenticated JSON endpoint the service worker uses when the browser rotates a subscription. Returns 204/400/401. |
| Service worker | `public/sw.js` | `push` → `showNotification`, `notificationclick` → focus/open, `pushsubscriptionchange` → re-subscribe and POST the new subscription. Pages are still never cached. |

Delivery only happens when a server-side caller invokes
`sendPushToUser(userId, { title, body, url })`. Today that is the manual
"Send test notification" button; the task-reminder dispatcher is intentionally
not part of this feature.

### Delivery behavior

- Sends to every subscription owned by the user, individually and sequentially.
- `404`/`410` from the push service means the subscription is gone: the row is
  pruned.
- Other failures increment `failure_count`; a later success resets it.
- A single endpoint failure never rejects the whole send. The service returns
  `{ sent, pruned, failed }` and logs counts/user id only — never endpoints,
  keys, or message contents.

### Validation limits

- Endpoint must be `https://`, a valid URL, and ≤ 2048 characters.
- `p256dh` and `auth` must be unpadded base64url, within the DB column widths.
- Payload: `title` 1–120, `body` 1–500, `url` site-relative or `https`, and the
  serialized JSON must stay under `PUSH_MAX_PAYLOAD_BYTES` (3072) so web-push
  stays below its ~4KB encrypted limit.
- Test sends are throttled to one per user per 10 seconds. The throttle is
  in-memory, so it is per instance and resets on restart.

## Environment setup

Generate a key pair once:

```bash
npx web-push generate-vapid-keys
```

Set the values in the deployment environment (see `.env.example`):

```
VAPID_PUBLIC_KEY=<public key>
VAPID_PRIVATE_KEY=<private key>
VAPID_SUBJECT=mailto:notifications@sanctuary.isaacdelalama.dev
```

- `VAPID_PUBLIC_KEY` is also sent to the browser and is not secret.
- `VAPID_PRIVATE_KEY` is a secret. Never commit it, log it, or expose it to the
  client bundle.
- `VAPID_SUBJECT` must be a `mailto:` or `https:` URL; it defaults to
  `mailto:notifications@sanctuary.isaacdelalama.dev` when unset.
- Missing either key disables push entirely; the app still boots.

Changing the keys invalidates every existing subscription (see rotation).

## Deployment notes

The production release needs:

1. The `VAPID_PUBLIC_KEY`, `VAPID_PRIVATE_KEY`, and optional `VAPID_SUBJECT`
   environment variables set on the server.
2. The additive `push_subscriptions` table. The release applies the Drizzle
   schema with `drizzle-kit push --force`; `migrations/2026-11-08-web-push-subscriptions.sql`
   documents the same change and is safe to apply by hand. It only creates a
   new table and index, so existing rows are unaffected.
3. The updated `public/sw.js` and `web-push` runtime dependency.

No `.woodpecker.yml` change is required.

## Browser and platform constraints

- **HTTPS only.** Push APIs require a secure context (`localhost` excepted for
  development, though the service worker is only registered in production
  builds).
- **User gesture required.** The permission prompt must be requested from a
  click. The settings component calls `Notification.requestPermission()`
  synchronously at the start of the click handler, before any `await`, which is
  what iOS enforces.
- **iOS 16.4+ and Home Screen.** Safari only supports Web Push for web apps
  added to the Home Screen. When the settings tab detects iOS without
  `navigator.standalone` / `display-mode: standalone`, it shows "Add to Home
  Screen" instructions instead of an enabled button.
- **No silent push.** Every push must show a notification (`userVisibleOnly`),
  which the service worker's `push` handler does.
- **Service worker registration is production-only** (`ServiceWorkerRegistrar`),
  so test the flow against a production build.
- The test button requires notification permission already granted; after
  denying permission the UI points the user at browser site settings.

## Testing on an iPhone

1. Deploy a build with VAPID keys configured over HTTPS.
2. Open the site in Safari on iOS 16.4+ and sign in.
3. Share → **Add to Home Screen**.
4. Open Sanctuary from the Home Screen icon (not from Safari).
5. Settings → Notifications. The tab should no longer show the install prompt.
6. Tap **Enable notifications** and accept the permission prompt.
7. Confirm the device list count increases, then tap **Send test notification**
   and verify the notification appears; tapping it focuses/opens `/settings`.
8. Tap **Disable on this device** and verify the count drops and no further
   notifications arrive.

## Rotating VAPID keys

1. Generate a new pair with `npx web-push generate-vapid-keys`.
2. Update `VAPID_PUBLIC_KEY`/`VAPID_PRIVATE_KEY` in the environment and restart
   the app. (Rotate the subject too if the contact address changed.)
3. Every existing row in `push_subscriptions` is now invalid: push services
   reject notifications signed by the old key. Users must re-enable
   notifications on each device; the settings UI will show "Not subscribed"
   only after the browser drops the old subscription, so stale rows may remain
   until pruned by failed sends.
4. Optional cleanup: `DELETE FROM push_subscriptions;` after rotation, or let
   the 404/410 pruning remove rows as delivery attempts fail.

## Rollback

- Remove `VAPID_PUBLIC_KEY` / `VAPID_PRIVATE_KEY` from the environment and
  restart: push becomes unconfigured, the settings tab explains that, and no
  sends are attempted. The service worker still handles `push` events, but
  nothing is sent.
- Revert the release to the previous image if the service worker or route
  changes must be withdrawn.
- The table is additive; leaving `push_subscriptions` in place is harmless and
  preserves subscriptions if the feature is re-enabled with the same keys.
  Dropping it only removes stored subscriptions.

## Local development

`npm run build` produces the production build used by the local testing skill
(`skills/sanctuary-local-testing/SKILL.md`). To exercise push locally, add
VAPID keys to the environment you start the server with, serve over
`http://127.0.0.1:4173` (a secure context for service workers), and use a
desktop browser in production mode. The mobile/iOS flow needs a real HTTPS
deployment.
