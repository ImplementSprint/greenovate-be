FROM node:22-alpine

WORKDIR /app

COPY package*.json .npmrc ./
RUN npm install

COPY --chown=node:node . .

RUN npm run build

USER node
EXPOSE 8080

CMD ["npm", "run", "start:prod"]
