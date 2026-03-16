// backend/src/config/db.js
const mongoose = require('mongoose');

let isConnecting = false;

const connectWithRetry = async (mongoUri) => {
  if (isConnecting) {
    return;
  }

  isConnecting = true;
  const options = {
    serverSelectionTimeoutMS: 5000,
  };

  try {
    await mongoose.connect(mongoUri, options);
    isConnecting = false;
    console.log('MongoDB connected');
  } catch (err) {
    isConnecting = false;
    console.error('MongoDB connection error:', err);
    setTimeout(() => connectWithRetry(mongoUri), 2000);
  }
};

const initMongo = (mongoUri) => {
  mongoose.set('strictQuery', true);

  mongoose.connection.on('disconnected', () => {
    console.warn('MongoDB disconnected. Attempting reconnect...');
    setTimeout(() => connectWithRetry(mongoUri), 2000);
  });

  mongoose.connection.on('error', (err) => {
    console.error('MongoDB error:', err);
  });

  return connectWithRetry(mongoUri);
};

module.exports = { initMongo };
