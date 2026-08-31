#!/usr/bin/env bash
#
# Sanctuary release tooling — automates skills/sanctuary-release/SKILL.md.
set -euo pipefail

# --- configuration -----------------------------------------------------------

SSH_HOST="${SANCTUARY_SSH_HOST:-hs1}"
STACK_DIR="/opt/stacks/sanctuary"
REGISTRY="registry.isaacdelalama.dev"
PUBLIC_URL="https://sanctuary.isaacdelalama.dev"
PUBLIC_HOST="sanctuary.isaacdelalama.dev"
GITHUB_SLUG="isaacdll23/sanctuary"
WP_ENV_FILE="${HOME}/.config/woodpecker/env"
WP_SERVER="${WOODPECKER_SERVER:-https://woodpecker.eesak.com}"
WP_LAN_IP="192.168.86.40"   # hairpin-NAT fallback for the LAN gotcha
WP_POLL_INTERVAL="${WP_POLL_INTERVAL:-15}"
WP_POLL_MAX="${WP_POLL_MAX:-60}"   # polls, not seconds: 60*15s = 15 min ceiling
WEB_SERVICE="web"
MIGRATE_SERVICE="migrate"
DB_SERVICE="db"
VERIFY_FAILURES=0
WP_REPO_ID=""

if [ -t 1 ]; then
  BOLD=$'\033[1m'; RED=$'\033[31m'; GREEN=$'\033[32m'; YELLOW=$'\033[33m'; BLUE=$'\033[34m'; RESET=$'\033[0m'
else
  BOLD=""; RED=""; GREEN=""; YELLOW=""; BLUE=""; RESET=""
fi

# Diagnostics go to stderr so stdout stays clean for captured values.
log()  { printf '%s%s%s %s\n' "$BLUE" "::" "$RESET" "$*" >&2; }
ok()   { printf '%s%s%s %s\n' "$GREEN" "ok" "$RESET" "$*" >&2; }
warn() { printf '%s%s%s %s\n' "$YELLOW" "!!" "$RESET" "$*" >&2; }
die()  { printf '%s%s%s %s\n' "$RED" "xx" "$RESET" "$*" >&2; exit 1; }

usage() {
  cat >&2 <<'USAGE'
Sanctuary release tooling — automates skills/sanctuary-release/SKILL.md.

Usage: scripts/release.sh <subcommand> [options]

  preflight                Local release gates: git state, tests, typecheck, build
                           options: --skip-tests
  deploy                   Preflight -> push -> wait CI -> verify images -> backup -> deploy -> verify
                           options: --skip-tests --pipeline <n> --receipt --dry-run
  wait                     Wait for a pipeline to reach terminal status
                           options: --pipeline <n> --sha <sha>
  verify                   Verify the currently deployed release on hs1
                           options: --tag sha-<short>
  rollback                 Roll production back to a previous sha- tag
                           options: --tag sha-<short> | --previous, --yes
  status                   Git state, deployed tag, containers, backups, recent pipelines

Invariants enforced (manual fallback documented in the skill):
  - IMAGE_TAG always carries the literal "sha-" prefix; computed once, never retyped
  - both sanctuary and sanctuary-migrate images must exist in the registry before .env is touched
  - .env is backed up before modification; the backup holds the previous good tag
  - pipeline waits accept only known terminal statuses; empty/unknown statuses abort immediately
  - deploy is not reported successful until post-deploy verification passes
USAGE
  exit "${1:-0}"
}

# --- small helpers -----------------------------------------------------------

have() { command -v "$1" >/dev/null 2>&1; }

require_local_tools() {
  local c
  for c in git ssh curl python3; do
    have "$c" || die "required command not found: $c"
  done
}

cd_repo_root() {
  local root
  root=$(git rev-parse --show-toplevel 2>/dev/null) || die "not inside a git repository"
  [ -f "$root/.woodpecker.yml" ] || die "$root does not look like the sanctuary repo (.woodpecker.yml missing)"
  cd "$root"
}

ssh_run() {
  ssh -o BatchMode=yes -o ConnectTimeout=8 "$SSH_HOST" "$@"
}

# ssh_get <remote command> — echo its stdout, die with context on failure.
ssh_get() {
  local out
  out=$(ssh_run "$1") || die "remote command failed on $SSH_HOST: $1"
  printf '%s' "$out"
}

# Validate a full image tag: literal sha- prefix + exactly 7 lowercase hex chars.
validate_tag() {
  case "$1" in
    sha-[0-9a-f][0-9a-f][0-9a-f][0-9a-f][0-9a-f][0-9a-f][0-9a-f]) return 0 ;;
    *) die "invalid image tag '$1' — expected sha-<7 hex> (CI publishes only sha- prefixed tags)" ;;
  esac
}

# The release tag for the current HEAD, computed exactly once per invocation.
tag_from_head() {
  local short
  short=$(git rev-parse --short=7 HEAD) || die "cannot resolve HEAD"
  case "$short" in
    [0-9a-f][0-9a-f][0-9a-f][0-9a-f][0-9a-f][0-9a-f][0-9a-f]) ;;
    *) die "unexpected short sha '$short'" ;;
  esac
  printf 'sha-%s' "$short"
}

code_ok() { # code_ok <actual> <comma,separated,accepted>
  local want
  for want in $(printf '%s' "$2" | tr ',' ' '); do
    [ "$1" = "$want" ] && return 0
  done
  return 1
}

# --- Woodpecker REST client --------------------------------------------------
# The CLI's --output json is polluted by its own stdout version warning, so all
# API access goes through curl. Every response is parsed strictly: missing keys
# and wrong types abort instead of yielding empty strings (the exact failure
# that once turned a status poll into a silent 10-minute sleep loop).

# Predicate form: returns 1 (never exits) so callers choose how to fail.
wp_require_env() {
  [ -r "$WP_ENV_FILE" ] || { warn "Woodpecker credentials not found at $WP_ENV_FILE"; return 1; }
  # shellcheck disable=SC1090
  set -a; . "$WP_ENV_FILE"; set +a
  WP_SERVER="${WOODPECKER_SERVER:-$WP_SERVER}"
  WP_TOKEN="${WP_TOKEN:-${WOODPECKER_TOKEN:-}}"
  [ -n "$WP_TOKEN" ] || { warn "no Woodpecker token in $WP_ENV_FILE"; return 1; }
  WP_HOST="${WP_SERVER#https://}"; WP_HOST="${WP_HOST#http://}"; WP_HOST="${WP_HOST%%/*}"
  return 0
}

# GET an API path (relative, e.g. "repos/20/pipelines"). Tries direct first;
# retries pinned to hs1's LAN IP because hairpin NAT to woodpecker.eesak.com
# is flaky from inside the LAN.
wp_api() {
  local path="$1" body
  case "$path" in /*) path="${path#/}" ;; esac
  if body=$(curl -fsS --max-time 20 "$WP_SERVER/api/$path" -H "Authorization: Bearer $WP_TOKEN" 2>/dev/null) \
     && [ -n "$body" ]; then
    printf '%s' "$body"
    return 0
  fi
  body=$(curl -fsS --max-time 20 --resolve "$WP_HOST:443:$WP_LAN_IP" "$WP_SERVER/api/$path" \
           -H "Authorization: Bearer $WP_TOKEN" 2>/dev/null) \
    || die "Woodpecker API request failed for /api/$path (direct and LAN-pinned)"
  [ -n "$body" ] || die "Woodpecker API returned an empty body for /api$path"
  printf '%s' "$body"
}

wp_repo_id() {
  [ -n "$WP_REPO_ID" ] && { printf '%s' "$WP_REPO_ID"; return 0; }
  WP_REPO_ID=$(wp_api "repos" | WP_SLUG="$GITHUB_SLUG" python3 -c '
import sys, json, os
repos = json.loads(sys.stdin.read())
for r in repos:
    if r.get("full_name") == os.environ["WP_SLUG"] or r.get("name") == os.environ["WP_SLUG"].split("/")[-1]:
        print(r["id"]); sys.exit(0)
sys.exit("repo not found in Woodpecker: " + os.environ["WP_SLUG"])
') || die "could not resolve Woodpecker repo id for $GITHUB_SLUG"
  printf '%s' "$WP_REPO_ID"
}

# json_get <dotted.path> <json-string> — print a scalar, or abort on
# missing keys / non-scalar values. Never yields an empty-looking success.
json_get() {
  JSON_GET_PATH="$1" python3 -c '
import sys, json, os
try:
    data = json.loads(sys.argv[1])
except Exception as exc:
    sys.exit("invalid JSON: %s" % exc)
cur = data
for part in os.environ["JSON_GET_PATH"].split("."):
    if isinstance(cur, list) and part.lstrip("-").isdigit():
        i = int(part)
        if -len(cur) <= i < len(cur):
            cur = cur[i]; continue
        sys.exit("index out of range: %s" % part)
    if isinstance(cur, dict) and part in cur:
        cur = cur[part]; continue
    sys.exit("key not found: %s (in %s)" % (part, type(cur).__name__))
if isinstance(cur, (dict, list)):
    sys.exit("value at %s is %s, expected a scalar" % (os.environ["JSON_GET_PATH"], type(cur).__name__))
print(cur)
' "$2"
}

# The newest main-branch pipeline whose commit starts with $1; empty if none.
wp_pipeline_for_sha() {
  wp_api "repos/$(wp_repo_id)/pipelines" | PIPE_SHA="$1" python3 -c '
import sys, json, os
want = os.environ["PIPE_SHA"]
best = None
try:
    pipelines = json.loads(sys.stdin.read())
except Exception as exc:
    sys.exit("invalid pipeline list JSON: %s" % exc)
for p in pipelines:
    if p.get("branch") != "main":
        continue
    if not str(p.get("commit", "")).startswith(want):
        continue
    n = int(p.get("number", 0))
    if best is None or n > best:
        best = n
if best is not None:
    print(best)
'
}

# wait_pipeline <number> [expected-commit-sha]
# Only known terminal statuses end the loop; anything unrecognized aborts.
wait_pipeline() {
  local n="$1" expected="${2:-}" i status body commit
  log "waiting for pipeline #$n (poll every ${WP_POLL_INTERVAL}s, ceiling $((WP_POLL_MAX * WP_POLL_INTERVAL / 60)) min)"
  for i in $(seq 1 "$WP_POLL_MAX"); do
    body=$(wp_api "repos/$(wp_repo_id)/pipelines/$n") || die "pipeline API request failed for #$n"
    status=$(json_get status "$body") || die "could not parse status of pipeline #$n"
    if [ -z "$status" ]; then
      die "pipeline #$n returned an EMPTY status — aborting instead of sleeping (raw: $(printf '%s' "$body" | head -c 200))"
    fi
    if [ -n "$expected" ]; then
      commit=$(json_get commit "$body" 2>/dev/null || printf 'unknown')
      case "$commit" in
        "$expected"*) ;;
        unknown) warn "pipeline #$n has no commit sha yet; continuing" ;;
        *) die "pipeline #$n belongs to commit ${commit:0:7}, expected $expected — refusing to wait on the wrong pipeline" ;;
      esac
    fi
    case "$status" in
      success)
        ok "pipeline #$n: success"
        return 0
        ;;
      failure|error|killed|declined|canceled|cancelled)
        die "pipeline #$n reached terminal status: $status (https://$WP_HOST/repos/$(wp_repo_id)/pipelines/$n)"
        ;;
      pending|running|queued|blocked|waiting_on_approval)
        printf '  poll %s/%s: %s\n' "$i" "$WP_POLL_MAX" "$status" >&2
        ;;
      *)
        die "unknown pipeline status '$status' — extend the known-status list in wait_pipeline if Woodpecker added one"
        ;;
    esac
    sleep "$WP_POLL_INTERVAL"
  done
  die "timed out after $((WP_POLL_MAX * WP_POLL_INTERVAL / 60)) min waiting for pipeline #$n"
}

# --- git state ---------------------------------------------------------------

git_assert_main() {
  local branch
  branch=$(git branch --show-current)
  [ "$branch" = "main" ] || die "releases run from main (currently on '$branch')"
  git remote get-url origin 2>/dev/null | grep -q "$GITHUB_SLUG" \
    || die "origin does not point at $GITHUB_SLUG"
}

git_assert_clean() {
  local dirty
  # Untracked files never reach the release push, so only tracked changes block.
  dirty=$(git status --porcelain --untracked-files=no || true)
  if [ -n "$dirty" ]; then
    warn "worktree is not clean:"
    printf '%s\n' "$dirty" | sed 's/^/    /' >&2
    die "commit or stash the files above before deploying (the release commit must be deliberate)"
  fi
  ok "worktree clean"
}

# Fetch origin/main; die on divergence/behind. Push when ahead, unless
# $1 = "no-push" (dry run). Echoes origin/main's sha for diff ranges.
git_sync_state() {
  local allow_push="${1:-push}" counts ahead behind
  git fetch origin main >/dev/null 2>&1 || die "git fetch origin main failed"
  counts=$(git rev-list --left-right --count HEAD...origin/main)
  ahead=$(printf '%s' "$counts" | cut -f1)
  behind=$(printf '%s' "$counts" | cut -f2)
  [ "$behind" = "0" ] || die "local main is $behind commit(s) behind origin/main — pull first"
  if [ "$ahead" != "0" ]; then
    if [ "$allow_push" = "push" ]; then
      log "local main is $ahead commit(s) ahead — pushing"
      git push origin main || die "git push failed"
      git fetch origin main >/dev/null 2>&1
    else
      warn "dry run: would push $ahead commit(s) to origin/main"
    fi
  fi
  git_assert_clean
  git rev-parse origin/main
}

# True when the range touches the Drizzle schema or migrations.
git_schema_changed() {
  local from="$1" to="$2"
  [ "$from" = "$to" ] && return 1
  git diff --name-only "$from..$to" | grep -qE '^(app/db/schema\.ts|migrations/)'
}

# --- local gates -------------------------------------------------------------

run_gates() {
  log "npm test"
  npm test >/dev/null || die "npm test failed"
  ok "tests passed"
  log "npm run typecheck"
  npm run typecheck >/dev/null 2>&1 || die "typecheck failed"
  ok "typecheck passed"
  log "npm run build"
  npm run build >/dev/null || die "build failed"
  ok "build passed"
}

# --- hs1 operations ----------------------------------------------------------

remote_image_tag() {
  ssh_run "grep -E '^IMAGE_TAG=' $STACK_DIR/.env 2>/dev/null | cut -d= -f2- | tr -d '\n'" || true
}

# Back up .env BEFORE modifying it; echoes the previous (rollback) IMAGE_TAG.
remote_backup_env() { # $1 = backup suffix
  local suffix="$1" backup prev
  backup="$STACK_DIR/.env.bak-before-$suffix"
  ssh_run "cp $STACK_DIR/.env $backup && test -s $backup" || die "failed to back up $STACK_DIR/.env"
  prev=$(remote_image_tag)
  ok "backed up .env -> $(basename "$backup") (previous IMAGE_TAG: ${prev:-<unset>})"
  printf '%s' "$prev"
}

# Prove both images exist in the registry BEFORE .env is touched.
remote_registry_has() { # $1 = tag
  ssh_run "docker manifest inspect $REGISTRY/sanctuary:$1 >/dev/null 2>&1" \
    || die "registry is missing $REGISTRY/sanctuary:$1 — refusing to touch .env"
  ssh_run "docker manifest inspect $REGISTRY/sanctuary-migrate:$1 >/dev/null 2>&1" \
    || die "registry is missing $REGISTRY/sanctuary-migrate:$1 — refusing to touch .env"
  ok "both images present in registry for $1"
}

remote_set_image_tag() { # $1 = tag
  ssh_run "sed -i 's/^IMAGE_TAG=.*/IMAGE_TAG=$1/' $STACK_DIR/.env"
  local actual
  actual=$(remote_image_tag)
  [ "$actual" = "$1" ] || die ".env IMAGE_TAG is '$actual', expected '$1' — aborting"
  ok "IMAGE_TAG=$actual"
}

remote_dump_db() { # $1 = label — best-effort guard before schema-changing releases
  local label="$1" file="/srv/sanctuary/backups/pre-$1.sql" cid
  log "schema files changed in this release — dumping database first"
  cid=$(remote_container_id "$DB_SERVICE" all)
  [ -n "$cid" ] || die "database container not found — cannot pg_dump"
  if ssh_run "mkdir -p /srv/sanctuary/backups && docker exec $cid sh -c 'pg_dump -U \"\$POSTGRES_USER\" \"\$POSTGRES_DB\"' > $file && test -s $file"; then
    ok "database dump saved on hs1: $file"
  else
    die "pg_dump failed — schema-changing release aborted (no rows were modified)"
  fi
}

remote_container_id() { # $1 = compose service; $2 = "running" (default) | "all"
  local scope="q"
  [ "${2:-running}" = "all" ] && scope="aq"
  ssh_run "cd $STACK_DIR && docker compose ps -$scope $1 2>/dev/null | head -1 | tr -d '\n'" || true
}

remote_wait_migrate_exit() {
  local i state exit_code cid
  for i in $(seq 1 24); do
    cid=$(remote_container_id "$MIGRATE_SERVICE" all)
    [ -n "$cid" ] || { sleep 5; continue; }
    state=$(ssh_run "docker inspect --format '{{.State.Status}}' $cid" 2>/dev/null || printf 'unknown')
    if [ "$state" = "exited" ]; then
      exit_code=$(ssh_get "docker inspect --format '{{.State.ExitCode}}' $cid")
      if [ "$exit_code" = "0" ]; then
        ok "migrate container exited 0"
        return 0
      fi
      ssh_run "docker logs --tail 15 $cid" >&2 || true
      die "migrate container exited $exit_code"
    fi
    sleep 5
  done
  die "migrate container did not exit within 2 minutes"
}

# --- verification -------------------------------------------------------------

smoke() { # $1 = path  $2 = accepted codes (comma-separated)  $3 = optional redirect glob
  local path="$1" want_codes="$2" want_redirect="${3:-}" out code redir attempt
  out="000"
  for attempt in 1 2; do
    if [ "$attempt" = "1" ]; then
      # First try hs1's loopback through Traefik: immune to LAN hairpin issues.
      out=$(ssh_run "curl -sS -o /dev/null -w '%{http_code} %{redirect_url}' --max-time 15 --resolve $PUBLIC_HOST:443:127.0.0.1 $PUBLIC_URL$path 2>/dev/null") || out="000"
    else
      out=$(curl -sS -o /dev/null -w '%{http_code} %{redirect_url}' --max-time 15 "$PUBLIC_URL$path" 2>/dev/null) || out="000"
    fi
    [ -n "$out" ] || out="000"
    code=${out%% *}
    [ -n "$code" ] || code="000"
    [ "$code" != "000" ] && break
  done
  redir=${out#* }
  [ "$redir" = "$out" ] && redir=""
  if code_ok "$code" "$want_codes"; then
    if [ -n "$want_redirect" ]; then
      case "$redir" in
        $want_redirect) ok "smoke $path -> HTTP $code -> $redir" ;;
        *) warn "smoke $path redirect -> '$redir' (expected $want_redirect)"; VERIFY_FAILURES=$((VERIFY_FAILURES + 1)) ;;
      esac
    else
      ok "smoke $path -> HTTP $code"
    fi
  else
    warn "smoke $path -> HTTP $code (expected $want_codes)"
    VERIFY_FAILURES=$((VERIFY_FAILURES + 1))
  fi
}

# verify [--tag sha-xxxxxxx]
cmd_verify() {
  local tag="" cid state image logs
  while [ $# -gt 0 ]; do
    case "$1" in
      --tag) tag="$2"; shift 2 ;;
      *) die "verify: unknown option $1" ;;
    esac
  done
  require_local_tools
  if [ -z "$tag" ]; then
    tag=$(remote_image_tag)
    [ -n "$tag" ] || die "could not read IMAGE_TAG from $STACK_DIR/.env on $SSH_HOST"
  fi
  validate_tag "$tag"
  VERIFY_FAILURES=0
  log "verifying $SSH_HOST deployment of $tag"

  # 1. web container runs the exact expected image and is running
  cid=$(remote_container_id "$WEB_SERVICE")
  if [ -n "$cid" ]; then
    image=$(ssh_get "docker inspect --format '{{.Config.Image}}' $cid")
    if [ "$image" = "$REGISTRY/sanctuary:$tag" ]; then
      ok "web runs $image"
    else
      warn "web runs $image, expected $REGISTRY/sanctuary:$tag"
      VERIFY_FAILURES=$((VERIFY_FAILURES + 1))
    fi
    state=$(ssh_get "docker inspect --format '{{.State.Status}}' $cid")
    if [ "$state" = "running" ]; then
      ok "web container running"
    else
      warn "web container state: $state"
      VERIFY_FAILURES=$((VERIFY_FAILURES + 1))
    fi
  else
    warn "web container not found"
    VERIFY_FAILURES=$((VERIFY_FAILURES + 1))
  fi

  # 2. migrate exited 0
  cid=$(remote_container_id "$MIGRATE_SERVICE" all)
  if [ -n "$cid" ]; then
    state=$(ssh_get "docker inspect --format '{{.State.Status}}:{{.State.ExitCode}}' $cid")
    case "$state" in
      exited:0) ok "migrate exited 0" ;;
      *) warn "migrate state: $state"; VERIFY_FAILURES=$((VERIFY_FAILURES + 1)) ;;
    esac
  else
    warn "migrate container not found (has up -d run for this tag?)"
    VERIFY_FAILURES=$((VERIFY_FAILURES + 1))
  fi

  # 3. database healthy
  cid=$(remote_container_id "$DB_SERVICE")
  if [ -n "$cid" ]; then
    state=$(ssh_get "docker inspect --format '{{if .State.Health}}{{.State.Health.Status}}{{else}}no-healthcheck{{end}}' $cid")
    case "$state" in
      healthy) ok "database healthy" ;;
      *) warn "database health: $state"; VERIFY_FAILURES=$((VERIFY_FAILURES + 1)) ;;
    esac
  else
    warn "database container not found"
    VERIFY_FAILURES=$((VERIFY_FAILURES + 1))
  fi

  # 4. web logs show the server listening, no fresh crash
  if logs=$(ssh_run "cd $STACK_DIR && docker compose logs $WEB_SERVICE --tail 30 2>&1"); then
    if printf '%s' "$logs" | grep -qE 'http://(localhost|0\.0\.0\.0):3000'; then
      ok "web server listening on 3000"
    else
      warn "web logs do not show the server listening"
      VERIFY_FAILURES=$((VERIFY_FAILURES + 1))
    fi
    if printf '%s' "$logs" | grep -qE 'FATAL|UnhandledPromiseRejection|EADDRINUSE'; then
      warn "web logs contain fatal-looking entries:"
      printf '%s\n' "$logs" | grep -E 'FATAL|UnhandledPromiseRejection|EADDRINUSE' | tail -3 | sed 's/^/    /' >&2
      VERIFY_FAILURES=$((VERIFY_FAILURES + 1))
    fi
  else
    warn "could not read web logs"
    VERIFY_FAILURES=$((VERIFY_FAILURES + 1))
  fi

  # 5. HTTP smoke tests
  smoke "/auth/login" "200"
  smoke "/" "200,302"
  smoke "/finance/expenses" "302" "*auth/login*"

  if [ "$VERIFY_FAILURES" -gt 0 ]; then
    die "$VERIFY_FAILURES verification check(s) failed for $tag"
  fi
  ok "all verification checks passed for $tag"
}

# --- receipts ------------------------------------------------------------------

write_receipt() { # $1 = kind  $2 = tag  $3 = pipeline  $4 = previous tag  $5 = backup summary
  local kind="$1" tag="$2" pipeline="$3" prev="$4" short="${tag#sha-}"
  local file="docs/releases/$(date -u +%Y-%m-%d)-$short.md"
  mkdir -p docs/releases
  {
    printf '# Sanctuary %s — %s\n\n' "$kind" "$(date -u '+%Y-%m-%d %H:%M UTC')"
    printf '| Field | Value |\n|---|---|\n'
    printf '| Commit | %s |\n' "$(git rev-parse HEAD)"
    printf '| Subject | %s |\n' "$(git log -1 --format=%s)"
    printf '| Pipeline | %s (status: %s) |\n' "${pipeline:-n/a}" "${PIPELINE_FINAL_STATUS:-n/a}"
    printf '| Image tag | %s |\n' "$tag"
    printf '| Previous tag | %s |\n' "${prev:-<none recorded>}"
    printf '| Rollback backups | %s |\n' "$5"
    printf '| Verification | container + migrate + smoke checks passed via scripts/release.sh |\n'
  } > "$file"
  ok "receipt written to $file (untracked; commit if you want the audit trail)"
}

# --- subcommands ---------------------------------------------------------------

# preflight [--skip-tests]
cmd_preflight() {
  local skip_tests=0 dirty counts ahead behind
  while [ $# -gt 0 ]; do
    case "$1" in
      --skip-tests) skip_tests=1; shift ;;
      *) die "preflight: unknown option $1" ;;
    esac
  done
  require_local_tools; cd_repo_root
  git_assert_main
  log "git state"
  git fetch origin main >/dev/null 2>&1 || die "git fetch origin main failed"
  counts=$(git rev-list --left-right --count HEAD...origin/main)
  ahead=$(printf '%s' "$counts" | cut -f1); behind=$(printf '%s' "$counts" | cut -f2)
  [ "$behind" = "0" ] || die "local main is $behind behind origin/main — pull first"
  if [ "$ahead" = "0" ]; then
    ok "main synchronized with origin/main"
  else
    warn "main is $ahead ahead of origin/main (deploy will push)"
  fi
  dirty=$(git status --porcelain || true)
  if [ -n "$dirty" ]; then
    warn "worktree has uncommitted changes:"
    printf '%s\n' "$dirty" | sed 's/^/    /' >&2
  else
    ok "worktree clean"
  fi
  git diff --check || die "git diff --check reported problems"
  ok "whitespace clean"
  if [ "$skip_tests" = "1" ]; then
    warn "skipping test/typecheck/build gates (--skip-tests)"
  else
    run_gates
  fi
  if git_schema_changed "$(git rev-parse origin/main)" "$(git rev-parse HEAD)"; then
    warn "schema files changed in this range — deploy will pg_dump before migrating; confirm the push is safe for existing rows"
  fi
  ok "preflight complete"
}

# Shared, stricter preflight used by deploy.
cmd_preflight_all() { # $1 = skip_tests
  git_assert_main
  if [ "$1" = "1" ]; then
    warn "skipping test/typecheck/build gates (--skip-tests)"
  else
    run_gates
  fi
  git diff --check || die "git diff --check reported problems"
}

# wait [--pipeline n] [--sha sha]
cmd_wait() {
  local pipeline="" sha=""
  while [ $# -gt 0 ]; do
    case "$1" in
      --pipeline) pipeline="$2"; shift 2 ;;
      --sha) sha="$2"; shift 2 ;;
      *) die "wait: unknown option $1" ;;
    esac
  done
  require_local_tools; cd_repo_root
  wp_require_env || die "Woodpecker credentials are required for wait"
  WP_REPO_ID=$(wp_repo_id) || die "could not resolve the Woodpecker repo id"
  if [ -z "$pipeline" ]; then
    [ -n "$sha" ] || sha=$(git rev-parse HEAD)
    log "auto-detecting pipeline for ${sha:0:7}"
    pipeline=$(wp_pipeline_for_sha "$sha")
    [ -n "$pipeline" ] || die "no pipeline found for ${sha:0:7} — check Woodpecker (webhook may not have fired)"
  fi
  wait_pipeline "$pipeline" "${sha:-}"
}

# deploy [--skip-tests] [--pipeline n] [--receipt] [--dry-run]
cmd_deploy() {
  local skip_tests=0 dry_run=0 receipt=0 pipeline_override=""
  while [ $# -gt 0 ]; do
    case "$1" in
      --skip-tests) skip_tests=1; shift ;;
      --pipeline) pipeline_override="$2"; shift 2 ;;
      --receipt) receipt=1; shift ;;
      --dry-run) dry_run=1; shift ;;
      *) die "deploy: unknown option $1" ;;
    esac
  done
  require_local_tools; cd_repo_root
  wp_require_env || die "Woodpecker credentials are required for deploy"
  WP_REPO_ID=$(wp_repo_id) || die "could not resolve the Woodpecker repo id"
  local started; started=$(date -u '+%Y-%m-%d %H:%M UTC')

  # 1. local gates and strict git state
  cmd_preflight_all "$skip_tests"

  # 2. compute the tag once, from HEAD, and never retype it
  local tag short_sha prev_remote push_mode
  tag=$(tag_from_head)
  short_sha="${tag#sha-}"
  log "release tag: $tag"
  push_mode="push"
  [ "$dry_run" = "1" ] && push_mode="no-push"
  prev_remote=$(git_sync_state "$push_mode")

  # 3. schema-change detection (drives the pre-deploy pg_dump)
  local schema_changed=0
  git_schema_changed "$prev_remote" "$(git rev-parse HEAD)" && schema_changed=1
  [ "$schema_changed" = "1" ] && warn "release touches app/db/schema.ts or migrations/ — a pg_dump will be taken before migrating"

  # 4. CI: reuse an existing pipeline for this commit or wait for one to appear
  local pipeline="" tries
  if [ -n "$pipeline_override" ]; then
    pipeline="$pipeline_override"
    log "using pipeline #$pipeline (--pipeline)"
  else
    log "looking for the CI pipeline for ${short_sha}"
    for tries in $(seq 1 12); do
      pipeline=$(wp_pipeline_for_sha "$short_sha") || pipeline=""
      [ -n "$pipeline" ] && break
      [ "$tries" = "1" ] && log "pipeline not created yet; polling for up to 96s"
      sleep 8
    done
    [ -n "$pipeline" ] || die "no CI pipeline appeared for ${short_sha} — check https://$WP_HOST/repos/$(wp_repo_id)/pipelines"
  fi
  wait_pipeline "$pipeline" "$(git rev-parse HEAD)"
  PIPELINE_FINAL_STATUS="success"

  # 5. prove both images exist BEFORE touching .env
  remote_registry_has "$tag"

  if [ "$dry_run" = "1" ]; then
    local step_a=3 step_b=4
    [ "$schema_changed" = "1" ] && { step_a=4; step_b=5; }
    log "dry run — stopping before any mutation. Plan:"
    printf '  1. backup .env    -> %s/.env.bak-before-%s\n' "$STACK_DIR" "$short_sha" >&2
    [ "$schema_changed" = "1" ] && printf '  2. pg_dump        -> /srv/sanctuary/backups/pre-%s.sql\n' "$short_sha" >&2
    printf '  %s. set IMAGE_TAG -> %s\n' "$step_a" "$tag" >&2
    printf '  %s. docker compose pull && docker compose up -d\n' "$step_b" >&2
    printf '  %s. verify (containers, migrate exit 0, smoke tests)\n' "$((step_b + 1))" >&2
    ok "dry run complete — nothing was changed on $SSH_HOST"
    return 0
  fi

  # 6. backup first, then mutate
  local prev_tag backup_suffixes
  prev_tag=$(remote_backup_env "$short_sha")
  backup_suffixes=".env.bak-before-$short_sha"
  if [ "$schema_changed" = "1" ]; then
    remote_dump_db "$short_sha"
    backup_suffixes="$backup_suffixes + db dump pre-$short_sha.sql"
  fi

  # 7. deploy
  remote_set_image_tag "$tag"
  log "docker compose pull"
  ssh_run "cd $STACK_DIR && docker compose pull" >/dev/null || die "docker compose pull failed"
  log "docker compose up -d"
  ssh_run "cd $STACK_DIR && docker compose up -d" || die "docker compose up -d failed"
  remote_wait_migrate_exit

  # 8. verify before reporting success
  cmd_verify --tag "$tag"

  printf '\n%s%s%s\n' "$BOLD" "Release complete" "$RESET"
  printf '  started:   %s\n' "$started"
  printf '  commit:    %s (%s)\n' "$(git rev-parse HEAD)" "$(git log -1 --format=%s)"
  printf '  pipeline:  #%s (success)\n' "$pipeline"
  printf '  image:     %s:%s\n' "$REGISTRY" "$tag"
  printf '  previous:  %s\n' "${prev_tag:-<none>}"
  printf '  backups:   %s\n' "$backup_suffixes"
  printf '  rollback:  scripts/release.sh rollback --tag %s --yes\n' "${prev_tag:-sha-XXXXXXX}"
  [ "$receipt" = "1" ] && write_receipt deploy "$tag" "$pipeline" "$prev_tag" "$backup_suffixes"
  return 0
}

# rollback --tag sha-x | --previous [--yes]
cmd_rollback() {
  local tag="" previous=0 assume_yes=0 reply prev_tag backup_suffixes backup current
  while [ $# -gt 0 ]; do
    case "$1" in
      --tag) tag="$2"; shift 2 ;;
      --previous) previous=1; shift ;;
      --yes) assume_yes=1; shift ;;
      *) die "rollback: unknown option $1" ;;
    esac
  done
  require_local_tools; cd_repo_root
  wp_require_env || die "Woodpecker credentials are required for rollback (registry + verification)"
  WP_REPO_ID=$(wp_repo_id) || die "could not resolve the Woodpecker repo id"
  [ $previous -eq 1 ] || [ -n "$tag" ] || die "rollback needs --tag sha-<short> or --previous"

  if [ $previous -eq 1 ]; then
    backup=$(ssh_get "ls -1t $STACK_DIR/.env.bak-* 2>/dev/null | head -1")
    [ -n "$backup" ] || die "no .env backups found on $SSH_HOST — cannot resolve --previous"
    tag=$(ssh_get "grep -E '^IMAGE_TAG=' $backup | cut -d= -f2-")
    [ -n "$tag" ] || die "backup $backup contains no IMAGE_TAG"
    log "--previous resolved to $tag (from $(basename "$backup"))"
  fi
  validate_tag "$tag"

  current=$(remote_image_tag)
  [ "$tag" != "$current" ] || die "production is already on $tag"
  remote_registry_has "$tag"

  if [ "$assume_yes" != "1" ]; then
    [ -t 0 ] || die "non-interactive shell: pass --yes to confirm the rollback"
    printf 'Roll %s from %s back to %s? [y/N] ' "$STACK_DIR" "$current" "$tag"
    read -r reply
    case "$reply" in
      y|Y|yes|YES) ;;
      *) die "rollback aborted" ;;
    esac
  fi

  prev_tag=$(remote_backup_env "rollback-$(date -u +%Y%m%d-%H%M%S)")
  backup_suffixes=".env.bak-before-rollback-*"
  remote_set_image_tag "$tag"
  log "docker compose pull && up -d"
  ssh_run "cd $STACK_DIR && docker compose pull" >/dev/null || die "docker compose pull failed"
  ssh_run "cd $STACK_DIR && docker compose up -d" || die "docker compose up -d failed"
  remote_wait_migrate_exit
  cmd_verify --tag "$tag"
  printf '\n%s%s%s -> %s\n' "$BOLD" "Rollback complete" "$RESET" "$tag"
  printf '  previous:  %s\n  backups:   %s\n' "${prev_tag:-<none>}" "$backup_suffixes"
}

# status — read-only overview
cmd_status() {
  require_local_tools; cd_repo_root
  local counts ahead behind dirty bks svc id line
  log "local git"
  printf '  branch:     %s\n' "$(git branch --show-current)"
  printf '  HEAD:       %s %s\n' "$(git rev-parse --short=7 HEAD)" "$(git log -1 --format=%s)"
  if git fetch origin main >/dev/null 2>&1; then
    counts=$(git rev-list --left-right --count HEAD...origin/main)
    ahead=$(printf '%s' "$counts" | cut -f1); behind=$(printf '%s' "$counts" | cut -f2)
    printf '  divergence: +%s / -%s vs origin/main\n' "$ahead" "$behind"
  else
    warn "git fetch failed (offline?)"
  fi
  dirty=$(git status --porcelain || true)
  if [ -z "$dirty" ]; then
    printf '  worktree:   clean\n'
  else
    printf '  worktree:\n'
    printf '%s\n' "$dirty" | sed 's/^/    /'
  fi

  if ssh -o BatchMode=yes -o ConnectTimeout=5 "$SSH_HOST" true 2>/dev/null; then
    log "hs1 ($SSH_HOST)"
    printf '  IMAGE_TAG:  %s\n' "$(remote_image_tag || printf '<unreadable>')"
    for svc in "$WEB_SERVICE" "$MIGRATE_SERVICE" "$DB_SERVICE"; do
      id=$(remote_container_id "$svc" all)
      if [ -n "$id" ]; then
        line=$(ssh_get "docker inspect --format '{{.State.Status}} {{if .State.Health}}{{.State.Health.Status}}{{else}}exit={{.State.ExitCode}}{{end}}' $id")
        printf '  %-8s  %s\n' "$svc" "$line"
      else
        printf '  %-8s  <missing>\n' "$svc"
      fi
    done
    bks=$(ssh_run "ls -1t $STACK_DIR/.env.bak-* 2>/dev/null | head -5" || true)
    if [ -n "$bks" ]; then
      printf '  backups:\n'
      printf '%s\n' "$bks" | sed 's/^/    /'
    else
      printf '  backups:    <none>\n'
    fi
  else
    warn "$SSH_HOST unreachable — skipping remote status"
  fi

  if wp_require_env; then
    WP_REPO_ID=$(wp_repo_id) || { warn "could not resolve the Woodpecker repo id — skipping pipeline status"; return 0; }
    log "recent Woodpecker pipelines"
    wp_api "repos/$(wp_repo_id)/pipelines" | python3 -c '
import sys, json
for p in json.loads(sys.stdin.read())[:3]:
    print("  #%s %-10s %s %s" % (p.get("number"), p.get("status"), str(p.get("commit", ""))[:7], p.get("branch")))
'
  fi
}

# --- entry point -----------------------------------------------------------------

main() {
  if [ $# -lt 1 ]; then
    usage 1
  fi
  local cmd="$1"; shift
  case "$cmd" in
    preflight) cmd_preflight "$@" ;;
    deploy)    cmd_deploy "$@" ;;
    wait)      cmd_wait "$@" ;;
    verify)    cmd_verify "$@" ;;
    rollback)  cmd_rollback "$@" ;;
    status)    cmd_status "$@" ;;
    -h|--help|help) usage 0 ;;
    *) die "unknown subcommand '$cmd' (run with --help)" ;;
  esac
}

main "$@"
