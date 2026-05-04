# =============================================
# GoSellr Backend – Docker (NestJS)
# =============================================
# Config via env; no hardcoded ports or DB URLs in image.

# ---- Base ----
FROM node:20-alpine AS base
WORKDIR /app

# ---- Dependencies ----
FROM base AS deps
COPY package*.json ./
RUN npm ci

# ---- Build ----
FROM base AS build
COPY --from=deps /app/node_modules ./node_modules
COPY . .
RUN npm run build

# ---- Production ----
FROM base AS production
ENV NODE_ENV=production
ENV PORT=5000

RUN addgroup -g 1001 -S nodejs && adduser -S nodejs -u 1001

COPY --from=build /app/dist ./dist
COPY --from=deps /app/package*.json ./
RUN npm ci --only=production && npm cache clean --force

RUN mkdir -p /app/uploads /app/logs /app/temp && chown -R nodejs:nodejs /app
USER nodejs

EXPOSE 5000

# Health check (no hardcoded port: app listens on PORT, default 5000)
HEALTHCHECK --interval=30s --timeout=10s --start-period=5s --retries=3 \
  CMD node -e "require('http').get('http://127.0.0.1:5000/api/health', (r) => process.exit(r.statusCode === 200 ? 0 : 1)).on('error', () => process.exit(1))"

CMD ["node", "dist/main.js"]
