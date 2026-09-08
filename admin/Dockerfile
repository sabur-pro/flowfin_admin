# Stage 1: зависимости. Отдельный слой, чтобы правка кода не пересобирала npm ci.
FROM node:22-alpine AS deps

WORKDIR /usr/src/app

COPY package*.json ./
RUN npm ci

# Stage 2: сборка
FROM node:22-alpine AS builder

WORKDIR /usr/src/app

COPY --from=deps /usr/src/app/node_modules ./node_modules
COPY . .

# Домены для Server Actions нужны на этапе сборки: они попадают в next.config.
ARG ADMIN_ALLOWED_ORIGINS=""
ENV ADMIN_ALLOWED_ORIGINS=$ADMIN_ALLOWED_ORIGINS
ENV NEXT_TELEMETRY_DISABLED=1

RUN npm run build

# Stage 3: рантайм. Только standalone-сборка, без исходников и devDependencies.
FROM node:22-alpine AS runner

WORKDIR /usr/src/app

ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1
ENV PORT=3100
ENV HOSTNAME=0.0.0.0

# Не root: если процесс скомпрометируют, у него не будет прав на запись в образ.
RUN addgroup --system --gid 1001 nodejs \
 && adduser --system --uid 1001 nextjs

COPY --from=builder --chown=nextjs:nodejs /usr/src/app/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /usr/src/app/.next/static ./.next/static

USER nextjs

EXPOSE 3100

CMD ["node", "server.js"]
