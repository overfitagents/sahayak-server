FROM node:22.16.0-alpine

RUN mkdir -p /usr/src/node-app && chown -R node:node /usr/src/node-app

WORKDIR /usr/src/node-app

COPY package.json package-lock.json ./

RUN npm install --pure-lockfile

COPY --chown=node:node . .

EXPOSE 3000

CMD ["npm", "start"]