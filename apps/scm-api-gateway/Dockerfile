# Builder stage
FROM node:20-alpine AS builder
WORKDIR /app
COPY --chmod=0755 package*.json ./
RUN npm install --ignore-scripts
COPY --chmod=0755 --chown=node:node . .
RUN npm run build

# Runner stage
FROM node:20-alpine
WORKDIR /app
COPY --chmod=0755 package*.json ./
RUN npm ci --ignore-scripts --omit=dev || npm install --ignore-scripts --omit=dev
COPY --chmod=0755 --from=builder /app/dist ./dist
USER node
ENV NODE_ENV=production
EXPOSE 3001
CMD ["node", "dist/main.js"]
