FROM node:20-alpine
WORKDIR /app
COPY --chmod=0755 package*.json ./
RUN npm ci --ignore-scripts --omit=dev || npm install --ignore-scripts --omit=dev
COPY --chmod=0755 --chown=node:node . .
USER node
ENV NODE_ENV=production
EXPOSE 4001
HEALTHCHECK --interval=30s --timeout=10s --start-period=5s --retries=3 \
  CMD node -e "require('http').get('http://localhost:4001/health', r => process.exit(r.statusCode === 200 ? 0 : 1)).on('error', () => process.exit(1))"
CMD ["node", "src/index.js"]
