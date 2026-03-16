// batch/src/nseHttpClient.js
const axios = require('axios');
const { wrapper } = require('axios-cookiejar-support');
const { CookieJar } = require('tough-cookie');
const { logger } = require('./logger');

const jar = new CookieJar();

const baseHeaders = {
  'User-Agent':
    'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
  Accept:
    'text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,*/*;q=0.8',
  'Accept-Language': 'en-US,en;q=0.5',
  Referer: 'https://www.nseindia.com',
};

const client = wrapper(
  axios.create({
    withCredentials: true,
    jar,
    headers: baseHeaders,
    timeout: 30000,
  })
);

const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

const initSession = async () => {
  await client.get('https://www.nseindia.com');
};

const nseGet = async (url, options = {}, attempt = 1) => {
  try {
    const response = await client.get(url, { headers: baseHeaders, ...options });
    return response;
  } catch (err) {
    const status = err.response?.status;
    const isRetryable = !status || status >= 500;
    if (isRetryable && attempt <= 2) {
      logger.warn('NSE request failed, retrying', { url, attempt });
      await sleep(30000);
      return nseGet(url, options, attempt + 1);
    }
    throw err;
  }
};

module.exports = {
  initSession,
  nseGet,
};
