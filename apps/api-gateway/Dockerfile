FROM node:22-alpine

WORKDIR /app

COPY --chown=root:root --chmod=0755 package*.json .npmrc ./
RUN npm ci --ignore-scripts

COPY --chown=root:root --chmod=0755 . .

RUN npm run build

USER node
EXPOSE 8080

CMD ["npm", "run", "start:prod"]
