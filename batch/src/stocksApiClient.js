// batch/src/stocksApiClient.js
const axios = require('axios');
const { batchConfig } = require('./batchConfig');
const { logger } = require('./logger');

const apiClient = axios.create({
  baseURL: batchConfig.API_URL,
  timeout: 30000,
  headers: {
    'X-Batch-Key': batchConfig.BATCH_API_KEY,
  },
});

const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

const requestWithRetry = async (requestFn, attempt = 1) => {
  try {
    const response = await requestFn();
    return response;
  } catch (err) {
    const status = err.response?.status;
    const isRetryable = !status || status >= 500;
    if (isRetryable && attempt <= 2) {
      logger.warn('API request failed, retrying', { attempt });
      await sleep(30000);
      return requestWithRetry(requestFn, attempt + 1);
    }
    throw err;
  }
};

const upsertStocks = async (stocksArray) => {
  const response = await requestWithRetry(() =>
    apiClient.post('/stocks', stocksArray)
  );
  return response.data?.data || { upserted: 0, modified: 0 };
};

const upsertPrices = async (pricesArray) => {
  const chunkSize = 500;
  let totalUpserted = 0;
  let totalModified = 0;

  for (let i = 0; i < pricesArray.length; i += chunkSize) {
    const chunk = pricesArray.slice(i, i + chunkSize);
    const response = await requestWithRetry(() =>
      apiClient.post('/prices/batch-upsert', chunk)
    );
    totalUpserted += response.data?.data?.upserted || 0;
    totalModified += response.data?.data?.modified || 0;
  }

  return { totalUpserted, totalModified };
};

const getActiveStockCodes = async () => {
  const response = await requestWithRetry(() =>
    apiClient.get('/stocks', { params: { market: 'NSE' } })
  );
  const stocks = response.data?.data || [];
  return stocks.map((item) => item.code_id).filter(Boolean);
};

module.exports = {
  upsertStocks,
  upsertPrices,
  getActiveStockCodes,
};
