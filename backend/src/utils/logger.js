// backend/src/utils/logger.js
const fs = require('fs');
const path = require('path');
const winston = require('winston');

const logDir = process.env.LOG_DIR || './logs';
fs.mkdirSync(logDir, { recursive: true });

const logger = winston.createLogger({
  level: 'info',
  format: winston.format.combine(
    winston.format.timestamp(),
    winston.format.json()
  ),
  transports: [
    new winston.transports.Console(),
    new winston.transports.File({ filename: path.join(logDir, 'app.log') }),
  ],
});

module.exports = { logger };
