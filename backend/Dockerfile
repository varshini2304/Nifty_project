# backend/Dockerfile
FROM node:20-alpine

WORKDIR /app

RUN apk add --no-cache curl

COPY package*.json ./
RUN npm ci --only=production

RUN addgroup -S appgroup && adduser -S appuser -G appgroup

COPY src ./src
COPY .env.example ./.env.example

USER appuser

EXPOSE 5000

HEALTHCHECK --interval=30s --timeout=5s --retries=3 CMD curl -f http://localhost:5000/api/v1/health || exit 1

CMD ["node", "src/server.js"]
