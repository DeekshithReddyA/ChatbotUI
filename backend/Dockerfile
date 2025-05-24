FROM node:20-alpine

WORKDIR /backend

COPY package*.json ./

RUN npm install

COPY . .

EXPOSE 3000

CMD ["npx prisma migrate dev && npm run build && npm run start" ]