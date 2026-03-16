// backend/src/config/env.js
const path = require('path');
const dotenv = require('dotenv');

const requiredVars = [
  'MONGODB_URI',
  'JWT_SECRET',
  'JWT_EXPIRES_IN',
  'NICHIN_USERNAME',
  'NICHIN_PASSWORD_HASH',
  'BATCH_API_KEY',
  'PORT',
  'CORS_ORIGIN',
  'NODE_ENV',
  'LOG_DIR',
];

const loadEnv = () => {
  const envPath = process.env.ENV_FILE || path.resolve(process.cwd(), '.env');
  dotenv.config({ path: envPath });

  const missing = requiredVars.filter((key) => !process.env[key]);
  if (missing.length > 0) {
    throw new Error(`Missing required environment variables: ${missing.join(', ')}`);
  }

  return {
    MONGODB_URI: process.env.MONGODB_URI,
    JWT_SECRET: process.env.JWT_SECRET,
    JWT_EXPIRES_IN: process.env.JWT_EXPIRES_IN,
    NICHIN_USERNAME: process.env.NICHIN_USERNAME,
    NICHIN_PASSWORD_HASH: process.env.NICHIN_PASSWORD_HASH,
    BATCH_API_KEY: process.env.BATCH_API_KEY,
    PORT: Number(process.env.PORT),
    CORS_ORIGIN: process.env.CORS_ORIGIN,
    NODE_ENV: process.env.NODE_ENV,
    LOG_DIR: process.env.LOG_DIR,
  };
};

module.exports = { loadEnv };
