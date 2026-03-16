// batch/src/logger.js
const fs = require('fs');
const path = require('path');
const winston = require('winston');
const { batchConfig } = require('./batchConfig');

const logDir = batchConfig.LOG_DIR || './logs';
fs.mkdirSync(logDir, { recursive: true });

const pad = (value) => String(value).padStart(2, '0');
const now = new Date();
const dateStamp = `${now.getFullYear()}${pad(now.getMonth() + 1)}${pad(now.getDate())}`;
const logFile = path.join(logDir, `batch_${dateStamp}.log`);

const level = batchConfig.NODE_ENV === 'production' ? 'info' : 'debug';

const logger = winston.createLogger({
  level,
  format: winston.format.combine(winston.format.timestamp(), winston.format.json()),
  transports: [
    new winston.transports.Console(),
    new winston.transports.File({ filename: logFile }),
  ],
});

module.exports = { logger };
