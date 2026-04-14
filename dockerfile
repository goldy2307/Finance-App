# ── Build stage ──────────────────────────────────────────────────────────
FROM node:20-alpine AS base

WORKDIR /app

# Install deps separately so Docker cache layer is reused on code-only changes
COPY package*.json ./
RUN npm ci --omit=dev

# ── Production image ──────────────────────────────────────────────────────
FROM node:20-alpine AS production

WORKDIR /app

# Non-root user for security
RUN addgroup -S cashly && adduser -S cashly -G cashly

COPY --from=base /app/node_modules ./node_modules
COPY . .

# Create log dir and set ownership
RUN mkdir -p logs && chown -R cashly:cashly /app

USER cashly

EXPOSE 5000

HEALTHCHECK --interval=30s --timeout=5s --start-period=10s --retries=3 \
  CMD wget -qO- http://localhost:5000/api/v1/health || exit 1

CMD ["node", "src/server.js"]