FROM node:22-alpine AS build-env
COPY . /app
WORKDIR /app
RUN --mount=type=cache,target=/root/.npm npm ci
RUN npm run build

FROM build-env AS migrate
CMD ["./node_modules/.bin/drizzle-kit", "push", "--force"]

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
