FROM node:20-alpine

WORKDIR /usr/src/app

COPY --chown=root:root --chmod=0755 package*.json ./
RUN npm ci --ignore-scripts

COPY --chown=root:root --chmod=0755 . .
RUN npm run build

EXPOSE 4104
CMD ["npm", "run", "start:prod"]
