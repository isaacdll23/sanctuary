---
name: sanctuary-local-testing
description: Start Sanctuary locally with its isolated Docker PostgreSQL database and known admin review account. Use for local browser or Playwright testing; do not use for production or shared development databases.
---

# Sanctuary Local Testing

Run `skills/sanctuary-local-testing/scripts/start-local.sh` from the repository root to build the app, start the local database, synchronize the schema, seed the review account, and serve Sanctuary at `http://127.0.0.1:4173`. Pass `--background` (or `-b`) to start the server with `nohup` and return instead of blocking the terminal; the server log lands in `/tmp/sanctuary-local-server.log`.

The script is intentionally limited to this local environment:

- PostgreSQL runs in Docker as `sanctuary-local-db`, using the persistent volume `sanctuary-local-postgres` and binding only `127.0.0.1:5434`.
- The first run generates a random local DB password into the gitignored `.local-testing.env`; later runs read it from there. Keep that file out of git.
- It overrides `DATABASE_URL` for its own commands. Never edit `.env` or connect to the configured remote development database for local UI testing.
- `drizzle-kit push --force` applies the current Drizzle schema to this disposable local database before testing.
- The review account is reset on each run so its credentials and admin access are dependable:
  - Username: `test`
  - Password: `test`

Use Playwright to authenticate through the UI after startup, then inspect the required route. The account is local-only and deliberately has admin access, so do not reuse its credentials or this database configuration elsewhere.

## Lifecycle

- Leave the Docker volume intact between sessions to retain any test data created in the UI.
- Re-running the startup script is safe: it preserves the volume, applies schema changes, and restores the review account to the known admin credentials.
- Stop only the app process when finished unless the user asks to remove local testing data. Do not remove the Docker volume or container without explicit authorization.

## Learnings & Pitfalls

- **The script path is nested**: it lives at `skills/sanctuary-local-testing/scripts/start-local.sh`, not `scripts/start-local.sh`. Always invoke it from the repo root.
- **Port 4173 / stale servers**: if `start-local.sh` reports `EADDRINUSE 127.0.0.1:4173`, a previous instance is still bound. Find it with `lsof -iTCP:4173 -sTCP:LISTEN -n -P` and kill the PID, then re-run. A stale server serving old hashed assets causes opaque `500` errors and `404` on `/assets/root-*.js/css` in the browser console.
- **The app must reach the local DB**: the server *will not* work if `DATABASE_URL` points at the remote dev DB (e.g. `137.220.51.7:5433`). Symptoms: `connect ETIMEDOUT` in the server log and the login button stuck on "Logging in...". `start-local.sh` sets the correct local `DATABASE_URL` itself from the generated `.local-testing.env` password — if starting the server manually, source `.local-testing.env` and pass `DATABASE_URL=postgresql://sanctuary:${LOCAL_DB_PASSWORD}@127.0.0.1:5434/sanctuary_local HOST=127.0.0.1 PORT=4173`.
- **Default port is not 4173**: `react-router-serve` defaults to port `3000` unless `PORT=4173` is set. Always pass `PORT` explicitly when starting manually.
- **Restarting the server invalidates the browser session**: after a kill/restart, an open Playwright browser is logged out or stale. Re-login through the UI, or clear cookies/localStorage/sessionStorage first.
- **Rebuild before checking changes**: after editing theme/route code, run `npm run build` (or re-run the startup script) and restart the server, otherwise the browser still shows the old bundle.
- **Login validation**: the login route calls `argon2.verify` directly with no length policy, so short credentials like `test`/`test` work fine. There is no UI password-strength gate on login.
- **`npm test` / `npm run typecheck`**: run both before considering a change done; the unit suite currently has 52 tests across 14 suites.
