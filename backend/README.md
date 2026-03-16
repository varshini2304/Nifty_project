<!-- backend/README.md -->
# NichIn-Soft PL Monitor Tool Backend

This folder contains the Node.js 20 + Express.js 4 backend for the NichIn-Soft PL Monitor Tool.

## Setup

1. Create a `.env` file based on `.env.example` in `backend/`.
2. Install dependencies.
3. Start MongoDB (MongoDB 7).
4. Run the server.

```bash
cd backend
npm install
npm run dev
```

## Environment Variables

| Variable | Description |
| --- | --- |
| `MONGODB_URI` | MongoDB connection string for `nichinsoft_db` |
| `JWT_SECRET` | 256-bit secret for HS256 JWT signing |
| `JWT_EXPIRES_IN` | JWT expiry (e.g., `60m`) |
| `NICHIN_USERNAME` | Single admin username |
| `NICHIN_PASSWORD_HASH` | bcryptjs hash of the admin password |
| `BATCH_API_KEY` | API key for batch price scraper |
| `PORT` | Server port (default `5000`) |
| `CORS_ORIGIN` | Allowed origin(s), comma-separated |
| `NODE_ENV` | Environment (development/production) |
| `LOG_DIR` | Directory for log files |

## Scripts

- `npm run dev` — start server with nodemon
- `npm start` — start server
- `npm test` — run Jest tests (serial)
- `npm run seed` — seed counters and stock list

## API Endpoints (v1)

Auth

- `POST /api/v1/auth/login`
- `POST /api/v1/auth/logout`
- `GET /api/v1/auth/me`
- `GET /api/v1/health`

Trades

- `GET /api/v1/trades`
- `POST /api/v1/trades`
- `PUT /api/v1/trades/:tradeNo`
- `DELETE /api/v1/trades/:tradeNo`
- `POST /api/v1/trades/batch-save`
- `GET /api/v1/trades/by-stock/:code?asOfDate=YYYYMMDD`
- `GET /api/v1/trades/export-csv`
- `POST /api/v1/trades/import-csv`

Stocks

- `GET /api/v1/stocks`
- `GET /api/v1/stocks/search?q=`
- `GET /api/v1/stocks/:codeId`
- `POST /api/v1/stocks`

Prices

- `GET /api/v1/prices?dt=`
- `POST /api/v1/prices/batch-upsert`
- `GET /api/v1/prices/latest?code=`
- `GET /api/v1/prices/dates`

Monitor

- `GET /api/v1/monitor/pl?date=`
