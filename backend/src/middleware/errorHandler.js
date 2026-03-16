// backend/src/middleware/errorHandler.js
const { error } = require('../utils/apiResponse');

const errorHandler = (err, req, res, next) => {
  console.error(err);

  if (err && err.name === 'ValidationError') {
    const fields = Object.values(err.errors || {}).map((item) => ({
      field: item.path,
      message: item.message,
    }));
    return error(res, 'Validation failed', 400, { fields });
  }

  if (err && (err.name === 'JsonWebTokenError' || err.name === 'TokenExpiredError')) {
    return error(res, 'Unauthorised', 401);
  }

  if (err && err.code === 11000) {
    return error(res, 'Duplicate key error', 409);
  }

  if (err && (err.name === 'MulterError' || (err.message && err.message.toLowerCase().includes('csv')))) {
    return error(res, err.message || 'Invalid file upload', 400);
  }

  if (err && err.status) {
    return error(res, err.message || 'Request failed', err.status);
  }

  return error(res, 'Internal server error', 500);
};

module.exports = { errorHandler };
