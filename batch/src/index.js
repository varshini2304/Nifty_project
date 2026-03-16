// batch/src/index.js
const { batchConfig } = require('./batchConfig');
const { logger } = require('./logger');
const { startScheduler } = require('./scheduler');

logger.info('NichIn-Soft Batch Service starting');
logger.info(`API URL: ${batchConfig.API_URL}`);
logger.info(`Environment: ${batchConfig.NODE_ENV}`);

startScheduler();

process.on('unhandledRejection', (err) => {
  logger.error('Unhandled rejection', { error: err.message });
});
