// backend/src/utils/validateRequest.js
const { validationResult } = require('express-validator');
const { error } = require('./apiResponse');

const validateRequest = (req, res) => {
  const result = validationResult(req);
  if (!result.isEmpty()) {
    return error(res, 'Validation failed', 400, { errors: result.array() });
  }
  return null;
};

module.exports = { validateRequest };
