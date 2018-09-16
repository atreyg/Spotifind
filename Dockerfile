#Base image of node.js v8
FROM node:8

#Creating app directory
WORKDIR /usr/src/app

#Install app dependencies
COPY package*.json ./

RUN npm install --production

COPY . .

#Access port
EXPOSE 3000

#Run app in production environment
ENV NODE_ENV=production
CMD npm start