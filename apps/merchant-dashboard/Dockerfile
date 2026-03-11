# ── Stage 1: build ─────────────────────────────────────────────────────────────
FROM node:22-alpine AS builder
WORKDIR /app

ARG VITE_API_URL=http://localhost:3002/api/v1
ENV VITE_API_URL=$VITE_API_URL

ARG VITE_SOCKET_URL=http://localhost:3002
ENV VITE_SOCKET_URL=$VITE_SOCKET_URL

COPY package.json ./
RUN npm install --no-fund --no-audit

COPY . .
RUN npm run build

# ── Stage 2: serve via nginx ───────────────────────────────────────────────────
FROM nginx:1.27-alpine AS production

RUN apk add --no-cache curl
RUN rm -rf /usr/share/nginx/html/*

COPY --from=builder /app/dist /usr/share/nginx/html
COPY nginx.conf /etc/nginx/conf.d/default.conf

EXPOSE 80
HEALTHCHECK --interval=30s --timeout=5s --start-period=10s --retries=3 \
  CMD curl -f http://localhost/ || exit 1
