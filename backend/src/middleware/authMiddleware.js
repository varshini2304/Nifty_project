// backend/src/middleware/authMiddleware.js
const jwt = require('jsonwebtoken');
const { error } = require('../utils/apiResponse');

const authMiddleware = (req, res, next) => {
  const authHeader = req.headers.authorization || '';
  const token = authHeader.startsWith('Bearer ') ? authHeader.slice(7) : null;

  if (!token) {
    return error(res, 'Unauthorised', 401);
  }

  try {
    const payload = jwt.verify(token, process.env.JWT_SECRET);
    req.user = { username: payload.username, role: payload.role };
    return next();
  } catch (err) {
    return error(res, 'Unauthorised', 401);
  }
};

module.exports = { authMiddleware };
