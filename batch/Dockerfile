# batch/Dockerfile
FROM node:20-alpine

WORKDIR /app

RUN apk add --no-cache tzdata
ENV TZ=Asia/Kolkata

COPY package*.json ./
RUN npm ci --only=production

COPY src ./src

CMD ["node", "src/index.js"]
