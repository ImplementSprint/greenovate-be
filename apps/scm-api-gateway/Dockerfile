# Builder stage
FROM node:20-alpine AS builder
WORKDIR /app
COPY package*.json ./
RUN npm install
COPY --chown=node:node . .
RUN npm run build

# Runner stage
FROM node:20-alpine
WORKDIR /app
COPY package*.json ./
RUN npm ci --omit=dev || npm install --omit=dev
COPY --from=builder /app/dist ./dist
USER node
ENV NODE_ENV=production
EXPOSE 3001
CMD ["node", "dist/main.js"]
