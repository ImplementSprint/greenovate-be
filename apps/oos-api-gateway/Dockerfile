FROM node:20-alpine

WORKDIR /usr/src/app

COPY --chown=root:root --chmod=0755 package*.json ./
RUN npm ci --ignore-scripts

COPY --chown=root:root --chmod=0755 src ./src
COPY --chown=root:root --chmod=0755 test ./test
COPY --chown=root:root --chmod=0755 tsconfig.json tsconfig.build.json nest-cli.json ./
RUN npm run build

USER node
EXPOSE 4000
CMD ["npm", "run", "start:prod"]
