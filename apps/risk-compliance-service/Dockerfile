FROM node:20-alpine
WORKDIR /app
COPY --chown=root:root --chmod=0755 package*.json ./
RUN npm ci --ignore-scripts --omit=dev
COPY --chown=root:root --chmod=0755 src ./src
USER node
ENV NODE_ENV=production
EXPOSE 4010
HEALTHCHECK --interval=30s --timeout=10s --start-period=5s --retries=3 \
  CMD node -e "require('http').get('http://localhost:4010/health', r => process.exit(r.statusCode === 200 ? 0 : 1)).on('error', () => process.exit(1))"
CMD ["node", "src/index.js"]
