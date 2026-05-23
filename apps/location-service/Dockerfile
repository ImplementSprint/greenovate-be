# syntax=docker/dockerfile:1.7
FROM node:22-alpine AS builder

WORKDIR /app

COPY --chmod=0755 package*.json .npmrc ./
RUN --mount=type=secret,id=GITHUB_TOKEN \
  GITHUB_TOKEN="$(cat /run/secrets/GITHUB_TOKEN)" npm ci --ignore-scripts

COPY --chmod=0755 tsconfig*.json nest-cli.json ./
COPY --chmod=0755 apps ./apps
COPY --chmod=0755 libs ./libs

RUN npm run build:location-service

FROM node:22-alpine AS runner

ENV NODE_ENV=production
WORKDIR /app

COPY --chmod=0755 package*.json .npmrc ./
RUN --mount=type=secret,id=GITHUB_TOKEN \
  apk upgrade --no-cache zlib \
  && GITHUB_TOKEN="$(cat /run/secrets/GITHUB_TOKEN)" npm ci --ignore-scripts --omit=dev \
  && rm .npmrc package-lock.json \
  && addgroup --system --gid 1001 nodejs \
  && adduser --system --uid 1001 nestjs

COPY --chmod=0755 --chown=nestjs:nodejs --from=builder /app/dist ./dist

USER nestjs

EXPOSE 4010

CMD ["node", "dist/apps/location-service/main"]
