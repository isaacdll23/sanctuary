#!/usr/bin/env bash
set -euo pipefail

local_container_name="sanctuary-local-db"
local_volume_name="sanctuary-local-postgres"
local_db_user="sanctuary"
local_db_name="sanctuary_local"
local_db_port="5434"
local_app_port="4173"
local_cred_file=".local-testing.env"

if [[ "${1:-}" == "--background" || "${1:-}" == "-b" ]]; then
  serve_in_background=1
else
  serve_in_background=0
fi

# Local-only credentials, generated on first run and never committed.
if [[ ! -f "$local_cred_file" ]]; then
  cat > "$local_cred_file" <<EOF
LOCAL_DB_PASSWORD=$(openssl rand -hex 24)
SESSION_SECRET=$(openssl rand -hex 32)
TOKEN_ENCRYPTION_KEY=$(openssl rand -base64 32)
EOF
fi

# shellcheck disable=SC1090
source "$local_cred_file"

# The app runs in production mode via react-router-serve, which requires a
# session secret and a token-encryption key. Backfill them for credential
# files written by older versions of this script. TOKEN_ENCRYPTION_KEY must
# stay stable across runs: it decrypts encrypted notes and stored OAuth tokens
# held in the persistent local volume.
if [[ -z "${SESSION_SECRET:-}" ]]; then
  SESSION_SECRET="$(openssl rand -hex 32)"
  echo "SESSION_SECRET=$SESSION_SECRET" >> "$local_cred_file"
fi
if [[ -z "${TOKEN_ENCRYPTION_KEY:-}" ]]; then
  TOKEN_ENCRYPTION_KEY="$(openssl rand -base64 32)"
  echo "TOKEN_ENCRYPTION_KEY=$TOKEN_ENCRYPTION_KEY" >> "$local_cred_file"
fi

local_database_url="postgresql://${local_db_user}:${LOCAL_DB_PASSWORD}@127.0.0.1:${local_db_port}/${local_db_name}"

if ! docker info >/dev/null 2>&1; then
  echo "Docker is not available. Start Docker Desktop and run this script again." >&2
  exit 1
fi

if docker container inspect "$local_container_name" >/dev/null 2>&1; then
  docker start "$local_container_name" >/dev/null
else
  docker run \
    --name "$local_container_name" \
    --detach \
    --restart unless-stopped \
    --publish 127.0.0.1:${local_db_port}:5432 \
    --env POSTGRES_USER="$local_db_user" \
    --env POSTGRES_PASSWORD="$LOCAL_DB_PASSWORD" \
    --env POSTGRES_DB="$local_db_name" \
    --volume "$local_volume_name:/var/lib/postgresql/data" \
    postgres:16 >/dev/null
fi

for attempt in {1..30}; do
  if docker exec "$local_container_name" pg_isready --username="$local_db_user" --dbname="$local_db_name" >/dev/null 2>&1; then
    break
  fi

  if (( attempt == 30 )); then
    echo "Local PostgreSQL did not become ready within 30 seconds." >&2
    exit 1
  fi

  sleep 1
done

DATABASE_URL="$local_database_url" LOCAL_DB_PASSWORD="$LOCAL_DB_PASSWORD" npx drizzle-kit push --force
DATABASE_URL="$local_database_url" LOCAL_DB_PASSWORD="$LOCAL_DB_PASSWORD" npx tsx skills/sanctuary-local-testing/scripts/seed-local-review-account.ts
npm run build

echo "Sanctuary local test app: http://127.0.0.1:${local_app_port}"
echo "Review login: test / test"

if (( serve_in_background )); then
  log_file="/tmp/sanctuary-local-server.log"
  nohup env \
    DATABASE_URL="$local_database_url" \
    SESSION_SECRET="$SESSION_SECRET" \
    TOKEN_ENCRYPTION_KEY="$TOKEN_ENCRYPTION_KEY" \
    HOST=127.0.0.1 \
    PORT="$local_app_port" \
    npm run start > "$log_file" 2>&1 &
  echo "Server started in background (pid $!, log: $log_file)."
  echo "Stop it with: ss -ltnp | grep ${local_app_port} | grep -oP 'pid=\\K[0-9]+' | head -1 | xargs kill"
else
  exec env \
    DATABASE_URL="$local_database_url" \
    SESSION_SECRET="$SESSION_SECRET" \
    TOKEN_ENCRYPTION_KEY="$TOKEN_ENCRYPTION_KEY" \
    HOST=127.0.0.1 \
    PORT="$local_app_port" \
    npm run start
fi
