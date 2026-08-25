#!/usr/bin/env zsh
set -euo pipefail

local_container_name="sanctuary-local-db"
local_volume_name="sanctuary-local-postgres"
local_database_url="postgresql://sanctuary:sanctuary_local_review_2026@127.0.0.1:5434/sanctuary_local"
local_app_port="4173"

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
    --publish 127.0.0.1:5434:5432 \
    --env POSTGRES_USER=sanctuary \
    --env POSTGRES_PASSWORD=sanctuary_local_review_2026 \
    --env POSTGRES_DB=sanctuary_local \
    --volume "$local_volume_name:/var/lib/postgresql/data" \
    postgres:16 >/dev/null
fi

for attempt in {1..30}; do
  if docker exec "$local_container_name" pg_isready --username=sanctuary --dbname=sanctuary_local >/dev/null 2>&1; then
    break
  fi

  if (( attempt == 30 )); then
    print -u2 "Local PostgreSQL did not become ready within 30 seconds."
    exit 1
  fi

  sleep 1
done

DATABASE_URL="$local_database_url" npx drizzle-kit push --force
DATABASE_URL="$local_database_url" npx tsx skills/sanctuary-local-testing/scripts/seed-local-review-account.ts
npm run build

print "Sanctuary local test app: http://127.0.0.1:${local_app_port}"
print "Review login: test / test"
exec env \
  DATABASE_URL="$local_database_url" \
  HOST=127.0.0.1 \
  PORT="$local_app_port" \
  npm run start
