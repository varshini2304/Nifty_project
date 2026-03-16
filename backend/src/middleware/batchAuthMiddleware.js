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
  const maxLen = Math.max(received.length, expected.length);
  const receivedPadded = Buffer.alloc(maxLen);
  const expectedPadded = Buffer.alloc(maxLen);

  received.copy(receivedPadded);
  expected.copy(expectedPadded);

  const isMatch = crypto.timingSafeEqual(receivedPadded, expectedPadded);
  if (!isMatch) {
    return error(res, 'Unauthorised', 401);
  }

  return next();
};

module.exports = { batchAuthMiddleware };
