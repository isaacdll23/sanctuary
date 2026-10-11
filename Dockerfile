FROM node:22-alpine AS build-env
COPY . /app
WORKDIR /app
RUN --mount=type=cache,target=/root/.npm npm ci
RUN npm run build

FROM build-env AS migrate
# drizzle-kit push exits 0 even when it aborts (e.g. an interactive prompt with
# no TTY), which would let a failed migration pass as a successful release. Fail
# on a non-zero exit OR error output so `docker compose up -d` stops before web.
CMD ["sh", "-c", "./node_modules/.bin/drizzle-kit push --force > /tmp/drizzle-push.log 2>&1; rc=$?; cat /tmp/drizzle-push.log; if [ \"$rc\" -ne 0 ] || grep -qE 'Interactive prompts require|Error:' /tmp/drizzle-push.log; then exit 1; fi"]

FROM node:22-alpine AS runtime
ENV NODE_ENV=production
ENV HOST=0.0.0.0
ENV PORT=3000
COPY --from=build-env /app/package.json /app/package-lock.json /app/
COPY --from=build-env /app/node_modules /app/node_modules
COPY --from=build-env /app/build /app/build
WORKDIR /app
RUN npm prune --omit=dev
EXPOSE 3000
CMD ["npm", "run", "start"]
