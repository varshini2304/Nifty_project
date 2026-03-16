// backend/src/server.js
const { loadEnv } = require('./config/env');
const { initMongo } = require('./config/db');
const { app } = require('./app');

const config = loadEnv();

initMongo(config.MONGODB_URI);

const server = app.listen(config.PORT, () => {
  console.log(`Server running on port ${config.PORT}`);
});

process.on('unhandledRejection', (err) => {
  console.error('Unhandled rejection:', err);
  server.close(() => process.exit(1));
});
