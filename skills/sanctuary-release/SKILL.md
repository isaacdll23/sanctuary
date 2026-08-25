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
- **`IMAGE_TAG` always includes the literal `sha-` prefix.** The CI publishes only `sha-<short-sha>` tags — the bare short-sha (e.g. `fd3c231`) does not exist in the registry. A real example: the tag for commit `fd3c231` is `sha-fd3c231`. Never write the bare short-sha into `.env`.
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
2. Wait for the matching Woodpecker pipeline to reach terminal `success`; a successful individual step is not enough. Poll reliably via the REST API (see Woodpecker skill — the CLI's `--output json` is polluted by its own stdout version-warning line):
   ```bash
   set -a; . ~/.config/woodpecker/env; set +a
   # resolve the repo id once: curl -fsS "$WOODPECKER_SERVER/api/repos" -H "Authorization: Bearer $WOODPECKER_TOKEN"
   STATUS=$(curl -fsS "$WOODPECKER_SERVER/api/repos/<repo-id>/pipelines/<n>" -H "Authorization: Bearer $WOODPECKER_TOKEN" | python3 -c "import sys,json;print(json.load(sys.stdin)['status'])")
   ```
3. **Compute the tag exactly once and verify it exists before touching `.env`.** Derive `sha-<short-sha>` from the commit (e.g. `sha-$(git rev-parse --short=7 <sha>)` → `sha-fd3c231`) and confirm both images are already in the registry — never let `docker compose pull` be the thing that discovers a typo:
   ```bash
   TAG="sha-$(git rev-parse --short=7 <sha>)"
   echo "resolved TAG=$TAG"          # eyeball the sha- prefix here
   ssh hs1 'docker manifest inspect registry.isaacdelalama.dev/sanctuary:'"$TAG"' && \
     docker manifest inspect registry.isaacdelalama.dev/sanctuary-migrate:'"$TAG"'" \
     && echo "both images present"
   ```
   Only proceed if both resolves.
4. On `hs1`, inspect the current Compose definition and `IMAGE_TAG` (this is the rollback `IMAGE_TAG`).
5. Before **any** deploy, back up the current `.env` FIRST — copy before modifying, so the backup holds the previous good `IMAGE_TAG`:
   ```bash
   ssh hs1 'cp /opt/stacks/sanctuary/.env /opt/stacks/sanctuary/.env.bak-before-<short-sha>'
   ```
   Additionally, for a schema-changing release, create `/srv/sanctuary/backups/pre-<short-sha>.sql` using `pg_dump` inside the database container.
6. Set `IMAGE_TAG=<the resolved $TAG from step 3>` — reuse that exact string, do not retype it — then pull and up:
   ```bash
   ssh hs1 'sed -i "s/^IMAGE_TAG=.*/IMAGE_TAG=<TAG>/" /opt/stacks/sanctuary/.env && \
     grep -E "^IMAGE_TAG" /opt/stacks/sanctuary/.env'   # confirm it reads sha-<short-sha>
   ssh hs1 'cd /opt/stacks/sanctuary && docker compose pull && docker compose up -d'
   ```

## Verification

Do not report success until all of these hold:

- The Woodpecker pipeline is `success`.
- The migrate container exited 0 and its logs report the schema changes applied.
- The database and web containers are running; the database is healthy.
- `docker inspect sanctuary-web-1` shows the exact expected image tag, and that tag string begins with `sha-` (e.g. `registry.isaacdelalama.dev/sanctuary:sha-fd3c231`) — never the bare short-sha.
- The pre-deploy `docker manifest inspect` of both `sanctuary` and `sanctuary-migrate` succeeded (i.e. `IMAGE_TAG` was proven to exist before `.env` was touched).
- For schema changes, query `information_schema` or the relevant table to verify the deployed columns, defaults, nullability, and new tables without selecting user financial data.
- Web logs show the React Router server listening on port 3000 without a new fatal error.
- `/` returns 200 and unauthenticated `/finance/expenses` redirects to `/auth/login`.
- Local `main` is clean and synchronized with `origin/main`.

Record the exact commit, pipeline number, image tag, migration result, smoke-test result, and whether rollback backups were created.

## Rollback readiness

The prior `IMAGE_TAG`, environment backup, and database dump are the rollback points. Inspect and report them before any rollback. Do not restore a database dump or overwrite the stack environment without explicit user authorization unless an already-authorized deployment has left production unavailable and a straightforward image-tag rollback is the safest immediate recovery.
