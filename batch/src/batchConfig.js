// batch/src/batchConfig.js
const dotenv = require('dotenv');

dotenv.config();

const requiredVars = ['API_URL', 'BATCH_API_KEY', 'LOG_DIR', 'NODE_ENV', 'TZ'];
const missing = requiredVars.filter((key) => !process.env[key]);
if (missing.length > 0) {
  throw new Error(`Missing required environment variables: ${missing.join(', ')}`);
}

const batchConfig = Object.freeze({
  API_URL: process.env.API_URL,
  BATCH_API_KEY: process.env.BATCH_API_KEY,
  LOG_DIR: process.env.LOG_DIR,
  NODE_ENV: process.env.NODE_ENV,
  TZ: process.env.TZ,
});

module.exports = { batchConfig };
