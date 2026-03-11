# ── Stage 1: build ─────────────────────────────────────────────────────────────
FROM node:20-alpine AS builder
WORKDIR /app

# Accept build-time VITE env vars so they get baked into the bundle
ARG VITE_API_URL=http://localhost:3002/api/v1
ENV VITE_API_URL=$VITE_API_URL

COPY package.json ./
RUN npm install --no-fund --no-audit

COPY . .
RUN npm run build

# ── Stage 2: serve via nginx ───────────────────────────────────────────────────
FROM nginx:1.27-alpine AS production

# Install curl for healthcheck
RUN apk add --no-cache curl

# Remove default nginx page
RUN rm -rf /usr/share/nginx/html/*

# Copy built assets from builder
COPY --from=builder /app/dist /usr/share/nginx/html

# Copy custom nginx config (SPA routing support + gzip + security headers)
COPY nginx.conf /etc/nginx/conf.d/default.conf

EXPOSE 80

HEALTHCHECK --interval=30s --timeout=5s --retries=3 \
  CMD curl -sf http://127.0.0.1/index.html > /dev/null || exit 1

CMD ["nginx", "-g", "daemon off;"]
