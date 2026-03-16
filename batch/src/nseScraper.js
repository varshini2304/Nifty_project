// batch/src/nseScraper.js
const { initSession, nseGet } = require('./nseHttpClient');
const { parseBhavcopy, nowTimestamp } = require('./bhavcopyParser');
const { upsertStocks, upsertPrices, getActiveStockCodes } = require('./stocksApiClient');
const { logger } = require('./logger');

const buildStockObject = (item, flags) => {
  if (!item?.symbol || !item?.meta?.companyName) {
    throw new Error('Invalid stock data');
  }
  return {
    code_id: String(item.symbol).trim(),
    name: String(item.meta.companyName).trim(),
    market: 'NSE',
    n50_f: flags.n50_f,
    n500_f: flags.n500_f,
    updateSource: flags.updateSource,
    updateTime: nowTimestamp(),
  };
};

const mergeStocks = (primary, secondary) => {
  const map = new Map();
  primary.forEach((item) => map.set(item.code_id, item));
  secondary.forEach((item) => {
    if (map.has(item.code_id)) {
      const existing = map.get(item.code_id);
      map.set(item.code_id, { ...item, n50_f: existing.n50_f, n500_f: existing.n500_f });
    } else {
      map.set(item.code_id, item);
    }
  });
  return Array.from(map.values());
};

const runWeeklyStocksUpdate = async () => {
  try {
    logger.info('Starting weekly stocks update');
    await initSession();

    const nifty50Response = await nseGet(
      'https://www.nseindia.com/api/equity-stockIndices?index=NIFTY%2050'
    );
    const nifty50Data = nifty50Response.data?.data || [];
    const nifty50Stocks = [];

    nifty50Data.forEach((item) => {
      try {
        nifty50Stocks.push(
          buildStockObject(item, {
            n50_f: 1,
            n500_f: 1,
            updateSource: 'batch-weekly',
          })
        );
      } catch (err) {
        logger.warn('Skipping invalid Nifty-50 stock', { error: err.message });
      }
    });

    const nifty500Response = await nseGet(
      'https://www.nseindia.com/api/equity-stockIndices?index=NIFTY%20500'
    );
    const nifty500Data = nifty500Response.data?.data || [];
    const nifty500Stocks = [];

    nifty500Data.forEach((item) => {
      try {
        nifty500Stocks.push(
          buildStockObject(item, {
            n50_f: 0,
            n500_f: 1,
            updateSource: 'batch-weekly',
          })
        );
      } catch (err) {
        logger.warn('Skipping invalid Nifty-500 stock', { error: err.message });
      }
    });

    const combined = mergeStocks(nifty50Stocks, nifty500Stocks);
    const result = await upsertStocks(combined);
    logger.info('Stocks update complete', { upserted: result.upserted, modified: result.modified });
  } catch (err) {
    logger.error('Weekly stocks update failed', { error: err.message });
  }
};

const runDailyPriceUpdate = async (dateInt) => {
  try {
    logger.info('Starting daily price update', { dateInt });
    await initSession();
    const activeCodes = await getActiveStockCodes();
    const priceObjects = await parseBhavcopy(dateInt, activeCodes);

    if (priceObjects.length === 0) {
      logger.warn('No price data parsed for date', { dateInt });
      return;
    }

    const result = await upsertPrices(priceObjects);
    logger.info('Price update complete', { dateInt, upserted: result.totalUpserted });
  } catch (err) {
    logger.error('Daily price update failed', { error: err.message, dateInt });
  }
};

module.exports = {
  runWeeklyStocksUpdate,
  runDailyPriceUpdate,
};
