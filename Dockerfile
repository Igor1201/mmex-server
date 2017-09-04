FROM node:alpine
CMD npm install --only=production && npm start
