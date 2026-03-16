// backend/src/routes/monitor.js
const express = require('express');
const { query } = require('express-validator');
const { asyncHandler } = require('../utils/asyncHandler');
const { validateRequest } = require('../utils/validateRequest');
const { success } = require('../utils/apiResponse');
const { authMiddleware } = require('../middleware/authMiddleware');
const { isValidYYYYMMDD } = require('../utils/dateUtils');
const plCalculator = require('../services/plCalculator');

const router = express.Router();

/**
 * @swagger
 * /api/v1/monitor/pl:
 *   get:
 *     summary: Get monitor P&L data
 *     tags: [Monitor]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: date
 *         required: true
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: Monitor PL data fetched
 */
router.get(
  '/pl',
  authMiddleware,
  [
    query('date').custom((value) => {
      if (!value) {
        throw new Error('date is required');
      }
      if (!isValidYYYYMMDD(value)) {
        throw new Error('Invalid date');
      }
      return true;
    }),
  ],
  asyncHandler(async (req, res) => {
    const validationError = validateRequest(req, res);
    if (validationError) {
      return;
    }

    const dateInt = Number(req.query.date);
    const rows = await plCalculator.calculatePL(dateInt);
    if (rows.length === 0) {
      return success(res, [], 'No positions found for date');
    }

    return success(res, rows, 'Monitor PL data fetched');
  })
);

module.exports = router;
