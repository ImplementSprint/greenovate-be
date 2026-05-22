FROM node:22-alpine

WORKDIR /usr/src/app

COPY package*.json .npmrc ./
RUN npm install

COPY --chown=node:node . .
RUN npm run build

USER node
EXPOSE 4002
CMD ["npm", "run", "start:prod"]
