// backend/src/routes/stocks.js
const express = require('express');
const { asyncHandler } = require('../utils/asyncHandler');
const { error } = require('../utils/apiResponse');

const router = express.Router();

router.use(
  asyncHandler(async (req, res) => {
    return error(res, 'Stocks routes not implemented yet', 501);
  })
);

module.exports = router;
