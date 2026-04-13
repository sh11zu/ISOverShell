# ── Stage 1: build (compile native modules + TypeScript + Vite) ───────────────
FROM node:22-alpine AS builder
WORKDIR /app

# Native modules (better-sqlite3, ssh2) need build tools
RUN apk add --no-cache python3 make g++

# Install deps
COPY package*.json ./
COPY apps/frontend/package*.json  ./apps/frontend/
COPY apps/backend/package*.json   ./apps/backend/
COPY packages/types/package*.json ./packages/types/
RUN npm install --workspaces

# Copy source
COPY packages/ ./packages/
COPY apps/     ./apps/

# Build
RUN npm --workspace=backend  run build
RUN npm --workspace=frontend run build

# ── Stage 2: production image ─────────────────────────────────────────────────
FROM node:22-alpine AS runner
WORKDIR /app

# Copy production node_modules (native modules already compiled — no rebuild needed)
COPY --from=builder /app/node_modules ./node_modules

# Compiled output
COPY --from=builder /app/apps/backend/dist   ./apps/backend/dist
COPY --from=builder /app/apps/frontend/dist  ./apps/frontend/dist

EXPOSE 3001
CMD ["node", "apps/backend/dist/index.js"]
