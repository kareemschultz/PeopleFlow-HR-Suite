# fumadocs Dockerfile
FROM oven/bun:1.2.18 AS base
WORKDIR /app

# Copy all files
COPY . .

# Install dependencies
RUN bun install

# Build
# RUN bun run build --filter=fumadocs

# Run
FROM oven/bun:1.2.18 AS runner
WORKDIR /app

COPY --from=base /app/apps/fumadocs/.output /app/.output
COPY --from=base /app/apps/fumadocs/package.json /app/package.json

EXPOSE 3000
CMD ["bun", "run", ".output/server/index.mjs"]
