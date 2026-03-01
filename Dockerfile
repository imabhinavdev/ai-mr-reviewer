FROM node:20-alpine AS base

RUN corepack enable && corepack prepare pnpm@latest --activate
WORKDIR /app

FROM base AS deps
COPY package.json ./
RUN pnpm install

FROM base AS runner
ENV NODE_ENV=production
RUN addgroup --system --gid 1001 nodejs && adduser --system --uid 1001 app
USER app

COPY --from=deps /app/node_modules ./node_modules
COPY package.json ./
COPY src ./src

EXPOSE 3000
CMD ["node", "src/server.js"]
