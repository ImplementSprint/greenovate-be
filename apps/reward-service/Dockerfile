# syntax=docker/dockerfile:1

FROM node:22-slim AS base
WORKDIR /app

COPY --chmod=0755 package.json package-lock.json* ./
RUN npm install --ignore-scripts --production=false

COPY --chmod=0755 tsconfig.json ./tsconfig.json
COPY --chmod=0755 src ./src

RUN npm run build

FROM node:22-slim AS runner
WORKDIR /app
COPY --chmod=0755 --from=base /app/node_modules ./node_modules
COPY --chmod=0755 --from=base /app/dist ./dist

USER node
ENV NODE_ENV=production
ENV SCM_REWARD_PORT=3016
EXPOSE 3016
CMD ["node", "dist/server.js"]
