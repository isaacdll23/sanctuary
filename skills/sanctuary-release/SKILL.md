---
name: sanctuary-release
description: Release and verify Sanctuary on Isaac's hs1 production stack through GitHub, Woodpecker CI, the private registry, Drizzle schema push, and Docker Compose. Use when asked to merge, deploy, roll back, or inspect a Sanctuary production release.
---

# Sanctuary Release

Use the available `homelab-woodpecker-ci`, `homelab-ssh-servers`, and `homelab-compose-stacks` skills with this project-specific runbook. Deployment targets `/opt/stacks/sanctuary` on `hs1` and `https://sanctuary.isaacdelalama.dev`.

Do not expose `.env`, database credentials, registry credentials, or the Woodpecker token in tool output. Do not add AI attribution to commits.

## Release invariants

- Releases originate from `main` in `isaacdll23/sanctuary`.
- A push to `main` runs `.woodpecker.yml` and publishes exact tags:
  - `registry.isaacdelalama.dev/sanctuary:sha-<short-sha>`
  - `registry.isaacdelalama.dev/sanctuary-migrate:sha-<short-sha>`
- Pin production to the exact `sha-<short-sha>` tag in `/opt/stacks/sanctuary/.env`; do not deploy `latest`.
- The Compose `migrate` service runs `drizzle-kit push --force` and must complete successfully before `web` starts.
- Files in `migrations/` are **not** automatically executed by the image. Before release, confirm the Drizzle schema itself can migrate existing rows safely, especially new non-null columns.

## Preflight

1. Read the repository `AGENTS.md` and the three homelab skills named above.
2. Confirm the current branch, worktree contents, and `HEAD...origin/main` divergence. Preserve unrelated user changes.
3. Run `npm test`, `npm run typecheck`, `npm run build`, and `git diff --check`.
4. Inspect schema changes against the migrate image behavior in `Dockerfile`. Add compatible database defaults or a deliberate migration mechanism before pushing.
5. Confirm Woodpecker credentials/CLI and passwordless SSH access to `hs1` without printing secrets.

## Build and deploy

After the user has authorized deployment:

1. Commit only the intended files with no attribution trailer and push `main`.
2. Wait for the matching Woodpecker pipeline to reach terminal `success`; a successful individual step is not enough.
3. On `hs1`, inspect the current Compose definition and `IMAGE_TAG`.
4. Before a schema-changing release, create:
   - `/srv/sanctuary/backups/pre-<short-sha>.sql` using `pg_dump` inside the database container.
   - `/opt/stacks/sanctuary/.env.bak-before-<short-sha>`.
5. Set `IMAGE_TAG=sha-<short-sha>`, pull `migrate` and `web`, then run `docker compose up -d` from `/opt/stacks/sanctuary`.

## Verification

Do not report success until all of these hold:

- The Woodpecker pipeline is `success`.
- The migrate container exited 0 and its logs report the schema changes applied.
- The database and web containers are running; the database is healthy.
- `docker inspect sanctuary-web-1` shows the exact expected image tag.
- For schema changes, query `information_schema` or the relevant table to verify the deployed columns, defaults, nullability, and new tables without selecting user financial data.
- Web logs show the React Router server listening on port 3000 without a new fatal error.
- `/` returns 200 and unauthenticated `/finance/expenses` redirects to `/auth/login`.
- Local `main` is clean and synchronized with `origin/main`.

Record the exact commit, pipeline number, image tag, migration result, smoke-test result, and whether rollback backups were created.

## Rollback readiness

The prior `IMAGE_TAG`, environment backup, and database dump are the rollback points. Inspect and report them before any rollback. Do not restore a database dump or overwrite the stack environment without explicit user authorization unless an already-authorized deployment has left production unavailable and a straightforward image-tag rollback is the safest immediate recovery.
