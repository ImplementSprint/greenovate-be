FROM node:20-alpine

WORKDIR /usr/src/app

COPY package*.json ./
RUN npm install

COPY --chown=node:node . .
RUN npm run build

EXPOSE 4000
CMD ["npm", "run", "start:prod"]
