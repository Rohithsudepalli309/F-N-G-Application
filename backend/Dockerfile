FROM node:20-alpine AS builder
WORKDIR /app
COPY package*.json ./
RUN npm ci
COPY tsconfig.json ./
COPY src ./src
RUN npm run build

FROM node:20-alpine
WORKDIR /app
ENV NODE_ENV=production
RUN npm install -g pm2
COPY package*.json ./
RUN npm ci --omit=dev
COPY --from=builder /app/dist ./dist
COPY src/migrations ./src/migrations
COPY ecosystem.config.js ./
EXPOSE 3002
# pm2-runtime keeps the container alive and manages cluster workers.
CMD ["pm2-runtime", "ecosystem.config.js"]
