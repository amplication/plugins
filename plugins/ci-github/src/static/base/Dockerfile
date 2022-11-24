FROM node:16.16

WORKDIR /app

COPY ./package*.json .

RUN npm i --omit=dev

# This Dockerfile assumes that the build has been done already
COPY ./dist .

ENTRYPOINT ["node", "dist/main.js"]