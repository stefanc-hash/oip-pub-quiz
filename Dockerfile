# syntax=docker/dockerfile:1.7
# ─────────────────────────────────────────────────────────────────────
# Build stage: install deps, compile TS server + Vite client.
# Uses Debian-based Node so better-sqlite3 prebuilt binaries work.
# ─────────────────────────────────────────────────────────────────────
FROM node:20-bookworm-slim AS builder
WORKDIR /app

# Manifests first for Docker layer caching of npm install.
COPY package.json package-lock.json ./
COPY server/package.json server/
COPY client/package.json client/
RUN npm ci

# Sources
COPY server ./server
COPY client ./client

RUN npm run build && npm prune --omit=dev

# ─────────────────────────────────────────────────────────────────────
# Runtime stage: only the built artifacts + production node_modules.
# ─────────────────────────────────────────────────────────────────────
FROM node:20-bookworm-slim AS runtime
WORKDIR /app

ENV NODE_ENV=production \
    HOST=0.0.0.0 \
    DB_PATH=/data/quiz.db

# Volume mount target. Make it writable by the unprivileged 'node' user
# (uid 1000 in node:bookworm-slim). Railway will mount its volume here.
RUN mkdir -p /data && chown -R node:node /data

COPY --from=builder --chown=node:node /app/package.json ./
COPY --from=builder --chown=node:node /app/node_modules ./node_modules
COPY --from=builder --chown=node:node /app/server/package.json ./server/
COPY --from=builder --chown=node:node /app/server/dist ./server/dist
COPY --from=builder --chown=node:node /app/server/src/db/schema.sql ./server/dist/db/
COPY --from=builder --chown=node:node /app/client/dist ./client/dist

USER node

# Railway injects PORT — server reads it via config.ts. Document the default.
EXPOSE 3000

CMD ["node", "server/dist/server.js"]
