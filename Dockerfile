FROM node:22-alpine AS base

RUN corepack enable && corepack prepare pnpm@latest --activate
WORKDIR /app

FROM base AS deps
COPY package.json pnpm-lock.yaml* ./
RUN pnpm install --ignore-scripts

FROM base AS dashboard
COPY pnpm-lock.yaml* ./
COPY dashboard/package.json ./dashboard/package.json
RUN pnpm --prefix dashboard install --ignore-scripts
COPY dashboard ./dashboard
RUN pnpm --prefix dashboard build

FROM base AS runner
ENV NODE_ENV=production
RUN addgroup --system --gid 1001 nodejs && adduser --system --uid 1001 app
USER app

COPY --from=deps /app/node_modules ./node_modules
COPY package.json ./
COPY src ./src
COPY --from=dashboard /app/dashboard/dist ./dashboard/dist

EXPOSE 3000
CMD ["node", "src/server.js"]
