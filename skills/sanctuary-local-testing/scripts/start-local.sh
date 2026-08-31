#!/usr/bin/env zsh
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

if [[ ! -f "$local_cred_file" ]]; then
  local_db_password="$(openssl rand -hex 24)"
  print "LOCAL_DB_PASSWORD=$local_db_password" > "$local_cred_file"
else
  # shellcheck disable=SC1090
  source "$local_cred_file"
  local_db_password="$LOCAL_DB_PASSWORD"
fi

local_database_url="postgresql://${local_db_user}:${local_db_password}@127.0.0.1:${local_db_port}/${local_db_name}"

if ! docker info >/dev/null 2>&1; then
  print -u2 "Docker is not available. Start Docker Desktop and run this script again."
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
    --env POSTGRES_PASSWORD="$local_db_password" \
    --env POSTGRES_DB="$local_db_name" \
    --volume "$local_volume_name:/var/lib/postgresql/data" \
    postgres:16 >/dev/null
fi

for attempt in {1..30}; do
  if docker exec "$local_container_name" pg_isready --username="$local_db_user" --dbname="$local_db_name" >/dev/null 2>&1; then
    break
  fi

  if (( attempt == 30 )); then
    print -u2 "Local PostgreSQL did not become ready within 30 seconds."
    exit 1
  fi

  sleep 1
done

DATABASE_URL="$local_database_url" LOCAL_DB_PASSWORD="$local_db_password" npx drizzle-kit push --force
DATABASE_URL="$local_database_url" LOCAL_DB_PASSWORD="$local_db_password" npx tsx skills/sanctuary-local-testing/scripts/seed-local-review-account.ts
npm run build

print "Sanctuary local test app: http://127.0.0.1:${local_app_port}"
print "Review login: test / test"

if (( serve_in_background )); then
  log_file="/tmp/sanctuary-local-server.log"
  nohup env \
    DATABASE_URL="$local_database_url" \
    HOST=127.0.0.1 \
    PORT="$local_app_port" \
    npm run start > "$log_file" 2>&1 &
  print "Server started in background (pid $!, log: $log_file)."
  print "Stop it with: lsof -tiTCP:${local_app_port} -sTCP:LISTEN | xargs kill"
else
  exec env \
    DATABASE_URL="$local_database_url" \
    HOST=127.0.0.1 \
    PORT="$local_app_port" \
    npm run start
fi
