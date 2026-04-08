FROM node:18-alpine

WORKDIR /usr/src/app

COPY package*.json ./

RUN npm install --production

COPY . .

# Ensure the exports directory exists
RUN mkdir -p exports

EXPOSE 5000

CMD ["npm", "start"]
