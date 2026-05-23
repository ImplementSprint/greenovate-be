FROM node:22-alpine

WORKDIR /app

COPY --chmod=0755 package*.json .npmrc ./
RUN npm install --ignore-scripts

COPY --chmod=0755 --chown=node:node . .

RUN npm run build

USER node
EXPOSE 8080

CMD ["npm", "run", "start:prod"]
