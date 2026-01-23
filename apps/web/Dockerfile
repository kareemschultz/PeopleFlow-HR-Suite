# web Dockerfile
FROM oven/bun:1.2.18 AS base
WORKDIR /app

# Copy all files
COPY . .

# Install dependencies
RUN bun install

# Build
# RUN bun run build --filter=web

# Serve
FROM nginx:alpine
COPY --from=base /app/apps/web/dist /usr/share/nginx/html
EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]
