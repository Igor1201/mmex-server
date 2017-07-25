FROM node:alpine
RUN apk add --no-cache sqlite
CMD npm install --only=production && npm start
