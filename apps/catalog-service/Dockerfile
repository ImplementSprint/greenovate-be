FROM node:20-alpine

WORKDIR /usr/src/app

COPY --chmod=0755 package*.json ./
RUN npm install --ignore-scripts

COPY --chmod=0755 --chown=node:node . .
RUN npm run build

EXPOSE 4103
CMD ["npm", "run", "start:prod"]
