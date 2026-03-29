FROM node:20-alpine AS base
WORKDIR /app
COPY package*.json ./

FROM base AS deps
RUN npm install --only=production

FROM base AS builder
RUN npm install
COPY . .
RUN npx prisma generate
RUN npm run build

# Production image — minimal footprint
FROM node:20-alpine AS runner
WORKDIR /app
ENV NODE_ENV=production

COPY --from=deps /app/node_modules ./node_modules
COPY --from=builder /app/dist ./dist
COPY --from=builder /app/prisma ./prisma
COPY package*.json ./

EXPOSE 3000

CMD ["node", "dist/server.js"]
