// backend/src/routes/prices.js
const express = require('express');
const { body, query } = require('express-validator');
const { asyncHandler } = require('../utils/asyncHandler');
const { validateRequest } = require('../utils/validateRequest');
const { success, error } = require('../utils/apiResponse');
const { authMiddleware } = require('../middleware/authMiddleware');
const { batchAuthMiddleware } = require('../middleware/batchAuthMiddleware');
const { isValidYYYYMMDD, nowTimestamp } = require('../utils/dateUtils');
const StocksPriceList = require('../models/StocksPriceList');

const router = express.Router();

/**
 * @swagger
 * /api/v1/prices:
 *   get:
 *     summary: Get prices by date
 *     tags: [Prices]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: dt
 *         required: true
 *         schema:
 *           type: integer
 *       - in: query
 *         name: code
 *         required: false
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Prices fetched
 */
router.get(
  '/',
  authMiddleware,
  [
    query('dt')
      .custom((value) => {
        if (!value) {
          throw new Error('dt is required');
        }
        if (!isValidYYYYMMDD(value)) {
          throw new Error('Invalid dt');
        }
        return true;
      }),
    query('code').optional().trim().notEmpty().withMessage('code must be non-empty'),
  ],
  asyncHandler(async (req, res) => {
    const validationError = validateRequest(req, res);
    if (validationError) {
      return;
    }

    const dt = Number(req.query.dt);
    const filter = { dt };
    if (req.query.code) {
      filter.code = String(req.query.code).trim();
    }

    const prices = await StocksPriceList.find(filter).lean();
    return success(res, prices, 'Prices fetched');
  })
);

/**
 * @swagger
 * /api/v1/prices/batch-upsert:
 *   post:
 *     summary: Batch upsert prices
 *     tags: [Prices]
 *     security:
 *       - batchKey: []
 *     requestBody:
 *       required: true
 *     responses:
 *       200:
 *         description: Prices upserted
 */
router.post(
  '/batch-upsert',
  batchAuthMiddleware,
  [
    body().isArray({ min: 1 }).withMessage('Body must be a non-empty array'),
    body('*.dt').custom((value) => {
      if (!isValidYYYYMMDD(value)) {
        throw new Error('Invalid dt');
      }
      return true;
    }),
    body('*.code').trim().notEmpty().withMessage('code is required'),
    body('*.market').trim().notEmpty().withMessage('market is required'),
    body('*.price').isFloat({ gt: 0 }).withMessage('price must be > 0'),
    body('*.priceClose')
      .optional()
      .isFloat({ min: 0 })
      .withMessage('priceClose must be >= 0'),
    body('*.updateSource').trim().notEmpty().withMessage('updateSource is required'),
  ],
  asyncHandler(async (req, res) => {
    const validationError = validateRequest(req, res);
    if (validationError) {
      return;
    }

    const items = req.body;
    const chunkSize = 500;
    let upserted = 0;
    let modified = 0;

    for (let i = 0; i < items.length; i += chunkSize) {
      const chunk = items.slice(i, i + chunkSize);
      const ops = chunk.map((item) => {
        const updateDoc = {
          dt: Number(item.dt),
          code: String(item.code).trim(),
          market: String(item.market).trim(),
          price: Number(item.price),
          updateSource: String(item.updateSource).trim(),
          updateTime: item.updateTime ? String(item.updateTime).trim() : nowTimestamp(),
        };

        if (item.priceClose !== undefined) {
          updateDoc.priceClose = Number(item.priceClose);
        }

        return {
          updateOne: {
            filter: { dt: updateDoc.dt, code: updateDoc.code, market: updateDoc.market },
            update: { $set: updateDoc },
            upsert: true,
          },
        };
      });

      const result = await StocksPriceList.bulkWrite(ops, { ordered: false });
      upserted += result.upsertedCount || 0;
      modified += result.modifiedCount || 0;
    }

    return success(res, { upserted, modified, errors: [] }, 'Prices upserted');
  })
);

/**
 * @swagger
 * /api/v1/prices/latest:
 *   get:
 *     summary: Get latest price for a stock
 *     tags: [Prices]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: code
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Latest price fetched
 *       404:
 *         description: Price not found
 */
router.get(
  '/latest',
  authMiddleware,
  [query('code').trim().notEmpty().withMessage('code is required')],
  asyncHandler(async (req, res) => {
    const validationError = validateRequest(req, res);
    if (validationError) {
      return;
    }

    const code = String(req.query.code).trim();
    const price = await StocksPriceList.findOne({ code }).sort({ dt: -1 }).lean();
    if (!price) {
      return error(res, 'Price not found', 404);
    }

    return success(res, price, 'Price fetched');
  })
);

/**
 * @swagger
 * /api/v1/prices/dates:
 *   get:
 *     summary: Get available price dates
 *     tags: [Prices]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Price dates fetched
 */
router.get(
  '/dates',
  authMiddleware,
  asyncHandler(async (req, res) => {
    const dates = await StocksPriceList.distinct('dt');
    const sorted = dates.map(Number).sort((a, b) => b - a);
    return success(res, sorted, 'Price dates fetched');
  })
);

module.exports = router;
