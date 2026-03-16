// backend/src/middleware/batchAuthMiddleware.js
const crypto = require('crypto');
const { error } = require('../utils/apiResponse');

const batchAuthMiddleware = (req, res, next) => {
  const headerValue = req.header('X-Batch-Key');
  if (!headerValue || !process.env.BATCH_API_KEY) {
    return error(res, 'Unauthorised', 401);
  }

  const received = Buffer.from(headerValue, 'utf8');
  const expected = Buffer.from(process.env.BATCH_API_KEY, 'utf8');

  if (received.length !== expected.length) {
    return error(res, 'Unauthorised', 401);
  }

  const isMatch = crypto.timingSafeEqual(received, expected);
  if (!isMatch) {
    return error(res, 'Unauthorised', 401);
  }

  return next();
};

module.exports = { batchAuthMiddleware };
