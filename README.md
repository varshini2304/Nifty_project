<!-- README.md -->
# NichIn-Soft PL Monitor Tool

## Prerequisites
- Docker 24+
- Docker Compose v2

## Quick Start
1. `cp .env.example .env`
2. Edit `.env` with your secrets
3. `docker compose up --build -d`
4. Open `http://localhost:3000`
5. Login: `nichiuser` / `<your password>`

## Services

| Service  | URL                         | Description       |
|----------|-----------------------------|-------------------|
| Frontend | http://localhost:3000       | React UI          |
| Backend  | http://localhost:5000/api/v1| Express REST API  |
| MongoDB  | localhost:27017             | Database          |
| Batch    | (no port)                   | NSE price scraper |

## Manual Batch Triggers (for testing)

```
docker exec nichisoft_batch node -e "require('./src/nseScraper').runWeeklyStocksUpdate()"
```

```
docker exec nichisoft_batch node -e "require('./src/nseScraper').runDailyPriceUpdate(20260316)"
```

## Dev (without Docker)

```
cd backend && npm install && npm run dev
```

```
cd frontend && npm install && npm run dev
```

## Run all backend tests

```
cd backend && npm test
```

## End-to-End Smoke Tests

```
npm test
```

Note: Set `NICHIN_PASSWORD` in your local environment for smoke tests.
