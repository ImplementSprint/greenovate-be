# Builder stage
FROM node:20-alpine AS builder
WORKDIR /app
COPY --chown=root:root --chmod=0755 package*.json ./
RUN npm ci --ignore-scripts
COPY --chown=root:root --chmod=0755 . .
RUN npm run build

# Runner stage
FROM node:20-alpine
WORKDIR /app
COPY --chown=root:root --chmod=0755 package*.json ./
RUN npm ci --ignore-scripts --omit=dev
COPY --chown=root:root --chmod=0755 --from=builder /app/dist ./dist
USER node
ENV NODE_ENV=production
EXPOSE 3001
CMD ["node", "dist/main.js"]
