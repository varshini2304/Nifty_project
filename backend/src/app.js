// backend/src/app.js
const express = require('express');
const helmet = require('helmet');
const cors = require('cors');
const routes = require('./routes');
const { requestLogger } = require('./middleware/requestLogger');
const { generalLimiter } = require('./middleware/rateLimiter');
const { errorHandler } = require('./middleware/errorHandler');

const app = express();

const allowedOrigins = process.env.CORS_ORIGIN ? process.env.CORS_ORIGIN.split(',').map((origin) => origin.trim()) : [];

app.use(helmet());
app.use(cors({ origin: allowedOrigins, credentials: true }));
app.use(express.json({ limit: '10mb' }));
app.use(requestLogger());

app.use('/api/v1', (req, res, next) => {
  if (req.path === '/auth/login') {
    return next();
  }
  return generalLimiter(req, res, next);
});

app.use('/api/v1', routes);

app.use(errorHandler);

module.exports = { app };
