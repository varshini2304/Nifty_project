// backend/src/routes/index.js
// backend/src/routes/index.js
const express = require('express');
const mongoose = require('mongoose');
const { asyncHandler } = require('../utils/asyncHandler');
const { success } = require('../utils/apiResponse');
const authRoutes = require('./auth');
const tradeRoutes = require('./trades');
const stockRoutes = require('./stocks');
const priceRoutes = require('./prices');
const monitorRoutes = require('./monitor');

const router = express.Router();

router.get(
  '/health',
  asyncHandler(async (req, res) => {
    const dbOk = mongoose.connection.readyState === 1;
    return success(res, {
      status: 'ok',
      db: dbOk ? 'ok' : 'error',
      timestamp: new Date().toISOString(),
    }, 'Health check');
  })
);

router.use('/auth', authRoutes);
router.use('/trades', tradeRoutes);
router.use('/stocks', stockRoutes);
router.use('/prices', priceRoutes);
router.use('/monitor', monitorRoutes);

module.exports = router;
