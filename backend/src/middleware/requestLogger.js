// backend/src/middleware/requestLogger.js
const morgan = require('morgan');

const requestLogger = () => morgan('combined');

module.exports = { requestLogger };
