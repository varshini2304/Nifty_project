// batch/src/scheduler.js
const cron = require('node-cron');
const { runDailyPriceUpdate, runWeeklyStocksUpdate } = require('./nseScraper');
const { logger } = require('./logger');

const getTodayInt = () => {
  const now = new Date();
  const pad = (n) => String(n).padStart(2, '0');
  return Number(`${now.getFullYear()}${pad(now.getMonth() + 1)}${pad(now.getDate())}`);
};

const startScheduler = () => {
  logger.info('Scheduler started');

  cron.schedule(
    '30 13 * * 1-5',
    async () => {
      try {
        const today = getTodayInt();
        await runDailyPriceUpdate(today);
      } catch (err) {
        logger.error('Daily job failed', { error: err.message });
      }
    },
    { timezone: 'Asia/Kolkata' }
  );

  cron.schedule(
    '0 1 * * 0',
    async () => {
      try {
        await runWeeklyStocksUpdate();
      } catch (err) {
        logger.error('Weekly job failed', { error: err.message });
      }
    },
    { timezone: 'Asia/Kolkata' }
  );
};

module.exports = { startScheduler };
