// backend/src/middleware/rateLimiter.js
const rateLimit = require('express-rate-limit');

const loginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 5,
  standardHeaders: true,
  legacyHeaders: false,
  message: { success: false, data: null, message: 'Too many login attempts. Please try again later.' },
});

const generalLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: 100,
  standardHeaders: true,
  legacyHeaders: false,
  message: { success: false, data: null, message: 'Too many requests. Please try again later.' },
});

module.exports = { loginLimiter, generalLimiter };
