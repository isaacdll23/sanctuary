FROM node:20-alpine AS build-env
COPY . /app
WORKDIR /app
RUN npm ci
RUN npm run build
RUN npm prune --omit=dev

FROM node:20-alpine
ENV NODE_ENV=production
ENV HOST=0.0.0.0
ENV PORT=3000
COPY --from=build-env /app/package.json /app/package-lock.json /app/
COPY --from=build-env /app/node_modules /app/node_modules
COPY --from=build-env /app/build /app/build
WORKDIR /app
EXPOSE 3000
CMD ["npm", "run", "start"]
