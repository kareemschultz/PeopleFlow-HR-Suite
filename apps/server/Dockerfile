# server Dockerfile
FROM oven/bun:1.2.18 AS base
WORKDIR /app

# Copy all files
COPY . .

# Install dependencies
RUN bun install

# Build
# RUN bun run build --filter=server

# Run
FROM oven/bun:1.2.18 AS runner
WORKDIR /app

COPY --from=base /app/apps/server/dist /app/dist
COPY --from=base /app/apps/server/package.json /app/package.json
COPY --from=base /app/node_modules /app/node_modules

EXPOSE 3000
CMD ["bun", "run", "dist/index.js"]
