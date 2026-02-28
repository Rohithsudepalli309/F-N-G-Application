# ── Stage 1: deps ──────────────────────────────────────────────────────────────
FROM node:20-alpine AS deps
WORKDIR /app

COPY package.json ./
# Use npm ci (faster, reproducible) — package-lock is generated from pnpm-lock on first run
RUN npm install --omit=dev --no-fund --no-audit

# ── Stage 2: production ────────────────────────────────────────────────────────
FROM node:20-alpine AS production
WORKDIR /app

# Add non-root user for security
RUN addgroup -S fng && adduser -S fng -G fng

# Copy dependencies from deps stage
COPY --from=deps /app/node_modules ./node_modules

# Copy source
COPY src/ ./src/
COPY package.json ./

# Own the files
RUN chown -R fng:fng /app
USER fng

EXPOSE 3000

HEALTHCHECK --interval=15s --timeout=5s --retries=4 \
  CMD wget -qO- http://localhost:3000/health || exit 1

CMD ["node", "src/app.js"]
