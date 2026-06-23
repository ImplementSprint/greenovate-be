# syntax=docker/dockerfile:1

FROM node:22-slim AS base
WORKDIR /app

COPY --chown=root:root --chmod=0755 package.json package-lock.json ./
RUN npm ci --ignore-scripts --production=false

COPY --chown=root:root --chmod=0755 tsconfig.json ./tsconfig.json
COPY --chown=root:root --chmod=0755 src ./src

RUN npm run build

FROM node:22-slim AS runner
WORKDIR /app
COPY --chown=root:root --chmod=0755 --from=base /app/node_modules ./node_modules
COPY --chown=root:root --chmod=0755 --from=base /app/dist ./dist

USER node
ENV NODE_ENV=production
ENV SCM_MEMBER_PORT=3012
EXPOSE 3012
CMD ["node", "dist/server.js"]
