// backend/tests/testUtils.js
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const setupEnv = () => {
  process.env.MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/nichinsoft_db_test';
  process.env.JWT_SECRET = process.env.JWT_SECRET || 'test-secret-256-bit-string-test-secret-256-bit';
  process.env.JWT_EXPIRES_IN = process.env.JWT_EXPIRES_IN || '60m';
  process.env.NICHIN_USERNAME = process.env.NICHIN_USERNAME || 'nichiuser';
  process.env.NICHIN_PASSWORD_HASH = process.env.NICHIN_PASSWORD_HASH || bcrypt.hashSync('password123', 12);
  process.env.BATCH_API_KEY = process.env.BATCH_API_KEY || 'batch-secret';
  process.env.PORT = process.env.PORT || '5000';
  process.env.CORS_ORIGIN = process.env.CORS_ORIGIN || 'http://localhost:3000';
  process.env.NODE_ENV = process.env.NODE_ENV || 'test';
  process.env.LOG_DIR = process.env.LOG_DIR || './logs';
};

const connectDb = async () => {
  setupEnv();
  await mongoose.connect(process.env.MONGODB_URI);
};

const disconnectDb = async () => {
  await mongoose.disconnect();
};

const clearCollections = async () => {
  const collections = await mongoose.connection.db.collections();
  for (const collection of collections) {
    await collection.deleteMany({});
  }
};

module.exports = {
  setupEnv,
  connectDb,
  disconnectDb,
  clearCollections,
};
