---
name: sanctuary-local-testing
description: Start Sanctuary locally with its isolated Docker PostgreSQL database and known admin review account. Use for local browser or Playwright testing; do not use for production or shared development databases.
---

# Sanctuary Local Testing

Run `scripts/start-local.sh` from the repository root to build the app, start the local database, synchronize the schema, seed the review account, and serve Sanctuary at `http://127.0.0.1:4173`.

The script is intentionally limited to this local environment:

- PostgreSQL runs in Docker as `sanctuary-local-db`, using the persistent volume `sanctuary-local-postgres` and binding only `127.0.0.1:5434`.
- It overrides `DATABASE_URL` for its own commands. Never edit `.env` or connect to the configured remote development database for local UI testing.
- `drizzle-kit push --force` applies the current Drizzle schema to this disposable local database before testing.
- The review account is reset on each run so its credentials and admin access are dependable:
  - Username: `local-reviewer-20260824`
  - Password: `SanctuaryLocal!2026`

Use Playwright to authenticate through the UI after startup, then inspect the required route. The account is local-only and deliberately has admin access, so do not reuse its credentials or this database configuration elsewhere.

## Lifecycle

- Leave the Docker volume intact between sessions to retain any test data created in the UI.
- Re-running the startup script is safe: it preserves the volume, applies schema changes, and restores the review account to the known admin credentials.
- Stop only the app process when finished unless the user asks to remove local testing data. Do not remove the Docker volume or container without explicit authorization.
