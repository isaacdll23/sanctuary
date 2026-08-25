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
- A manually triggered `main` pipeline rebuilds the selected commit, then runs
  the `deploy-production` step. Push pipelines never deploy.
- Pin production to the exact `sha-<short-sha>` tag in `/opt/stacks/sanctuary/.env`; do not deploy `latest`.
- **`IMAGE_TAG` always includes the literal `sha-` prefix.** The CI publishes only `sha-<short-sha>` tags — the bare short-sha (e.g. `fd3c231`) does not exist in the registry. A real example: the tag for commit `fd3c231` is `sha-fd3c231`. Never write the bare short-sha into `.env`.
- The Compose `migrate` service runs `drizzle-kit push --force` and must complete successfully before `web` starts.
- Files in `migrations/` are **not** automatically executed by the image. Before release, confirm the Drizzle schema itself can migrate existing rows safely, especially new non-null columns.

## Preflight

1. Read the repository `AGENTS.md` and the three homelab skills named above.
2. Confirm the current branch, worktree contents, and `HEAD...origin/main` divergence. Preserve unrelated user changes.
3. For a release that includes local source changes, run `npm test`, `npm run typecheck`, `npm run build`, and `git diff --check`. For an already-pushed commit, rely on the matching successful CI pipeline rather than rebuilding an unrelated local worktree.
4. Inspect schema changes against the migrate image behavior in `Dockerfile`. Add compatible database defaults or a deliberate migration mechanism before pushing.
5. Confirm Woodpecker credentials/CLI and passwordless SSH access to `hs1` without printing secrets.

## Build and deploy

After the user has authorized deployment:

1. Commit only the intended files, push `main`, then wait for the matching push pipeline to succeed. It tests, type-checks, builds, and publishes the exact images, but does not deploy.
2. Decide the exact commit to release. Normally this is the current `origin/main` commit. Do not interpret an image tagged `latest` as the release target.
3. Trigger a **manual** pipeline for `main`; Sanctuary's Woodpecker repository ID is `20`. The manual pipeline rebuilds and re-publishes the selected SHA-tagged images before it deploys. When operating from the LAN, bypass the unreliable hairpin route with `--resolve`:
    ```bash
    set -a; . ~/.config/woodpecker/env; set +a
    curl --resolve woodpecker.eesak.com:443:192.168.86.40 \
      -fsS -o /dev/null -w '%{http_code}\n' \
      -X POST "$WOODPECKER_SERVER/api/repos/20/pipelines" \
      -H "Authorization: Bearer $WOODPECKER_TOKEN" \
      -H 'Content-Type: application/json' --data '{"branch":"main"}'
    ```
    A `204` means the pipeline was queued. Do not trigger a second pipeline merely because this endpoint has no response body.
4. Wait for the manual pipeline to reach terminal `success`; a successful individual step is not enough. Its `deploy-production` step verifies both images, backs up the current stack `.env` and database, pins `IMAGE_TAG`, runs Compose, waits for migration completion, and checks the resulting containers. Poll reliably via the REST API (the CLI can fail over LAN hairpin routing and its output includes an update warning):
    ```bash
    set -a; . ~/.config/woodpecker/env; set +a
    STATUS=$(curl --resolve woodpecker.eesak.com:443:192.168.86.40 -fsS \
      "$WOODPECKER_SERVER/api/repos/20/pipelines/<number>" \
      -H "Authorization: Bearer $WOODPECKER_TOKEN" | \
      python3 -c "import sys,json; print(json.load(sys.stdin)['status'])")
    ```
5. After a successful manual pipeline, compute the expected `sha-<short-sha>` tag exactly once for the selected commit. Use it only to verify the deployed state — the pipeline has already verified the images before touching `.env`:
   ```bash
   TAG="sha-$(git rev-parse --short=7 <sha>)"
   echo "resolved TAG=$TAG"          # eyeball the sha- prefix here
   ssh hs1 'docker manifest inspect registry.isaacdelalama.dev/sanctuary:'"$TAG"' && \
     docker manifest inspect registry.isaacdelalama.dev/sanctuary-migrate:'"$TAG"'" \
     && echo "both images present"
   ```
    Both manifests must resolve. Then inspect the Compose state on `hs1`; do not repeat the deployment commands manually.

## Verification

Do not report success until all of these hold:

- The Woodpecker pipeline is `success`.
- The migrate container exited 0. Inspect its logs if a schema change was expected or the service exits non-zero.
- The database and web containers are running; the database is healthy.
- `docker inspect sanctuary-web-1` shows the exact expected image tag, and that tag string begins with `sha-` (e.g. `registry.isaacdelalama.dev/sanctuary:sha-fd3c231`) — never the bare short-sha.
- The pre-deploy `docker manifest inspect` of both `sanctuary` and `sanctuary-migrate` succeeded (i.e. `IMAGE_TAG` was proven to exist before `.env` was touched).
- For schema changes, query `information_schema` or the relevant table to verify the deployed columns, defaults, nullability, and new tables without selecting user financial data.
- Web logs show the React Router server listening on port 3000 without a new fatal error.
- `/` redirects unauthenticated visitors to `/auth/login`, and unauthenticated `/finance/expenses` also redirects to `/auth/login`. From the LAN, use `curl --resolve sanctuary.isaacdelalama.dev:443:192.168.86.40` to test the production Traefik route directly.
- Local `main` is clean and synchronized with `origin/main`.

Record the exact commit, pipeline number, image tag, migration result, smoke-test result, previous image tag, and whether rollback backups were created.

## Rollback readiness

The prior `IMAGE_TAG`, environment backup, and database dump are the rollback points. Inspect and report them before any rollback. Do not restore a database dump or overwrite the stack environment without explicit user authorization unless an already-authorized deployment has left production unavailable and a straightforward image-tag rollback is the safest immediate recovery.
