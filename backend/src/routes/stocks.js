// backend/src/routes/stocks.js
const express = require('express');
const { body, param, query } = require('express-validator');
const { asyncHandler } = require('../utils/asyncHandler');
const { validateRequest } = require('../utils/validateRequest');
const { success, error } = require('../utils/apiResponse');
const { authMiddleware } = require('../middleware/authMiddleware');
const { batchAuthMiddleware } = require('../middleware/batchAuthMiddleware');
const { nowTimestamp } = require('../utils/dateUtils');
const StocksList = require('../models/StocksList');

const router = express.Router();

/**
 * @swagger
 * /api/v1/stocks:
 *   get:
 *     summary: Get stocks list
 *     tags: [Stocks]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: n50_f
 *         schema:
 *           type: integer
 *       - in: query
 *         name: n500_f
 *         schema:
 *           type: integer
 *       - in: query
 *         name: market
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Stocks fetched
 */
router.get(
  '/',
  authMiddleware,
  [
    query('n50_f').optional().isInt().withMessage('n50_f must be integer'),
    query('n500_f').optional().isInt().withMessage('n500_f must be integer'),
    query('market').optional().trim().notEmpty().withMessage('market must be non-empty'),
  ],
  asyncHandler(async (req, res) => {
    const validationError = validateRequest(req, res);
    if (validationError) {
      return;
    }

    const filter = {};
    if (req.query.n50_f !== undefined) {
      filter.n50_f = Number(req.query.n50_f);
    }
    if (req.query.n500_f !== undefined) {
      filter.n500_f = Number(req.query.n500_f);
    }
    if (req.query.market) {
      filter.market = String(req.query.market).trim();
    }

    const stocks = await StocksList.find(filter).sort({ code_id: 1 }).lean();
    return success(res, stocks, 'Stocks fetched');
  })
);

/**
 * @swagger
 * /api/v1/stocks/search:
 *   get:
 *     summary: Search stocks by code or name
 *     tags: [Stocks]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: q
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Stocks fetched
 */
router.get(
  '/search',
  authMiddleware,
  [
    query('q')
      .trim()
      .isLength({ min: 2 })
      .withMessage('q must be at least 2 characters'),
  ],
  asyncHandler(async (req, res) => {
    const validationError = validateRequest(req, res);
    if (validationError) {
      return;
    }

    const q = String(req.query.q).trim();
    const regex = new RegExp(q, 'i');
    const stocks = await StocksList.find({
      $or: [{ code_id: regex }, { name: regex }],
    })
      .sort({ code_id: 1 })
      .limit(20)
      .lean();

    return success(res, stocks, 'Stocks fetched');
  })
);

/**
 * @swagger
 * /api/v1/stocks/{codeId}:
 *   get:
 *     summary: Get stock by code
 *     tags: [Stocks]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: codeId
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Stock fetched
 *       404:
 *         description: Stock not found
 */
router.get(
  '/:codeId',
  authMiddleware,
  [param('codeId').trim().notEmpty().withMessage('codeId is required')],
  asyncHandler(async (req, res) => {
    const validationError = validateRequest(req, res);
    if (validationError) {
      return;
    }

    const codeId = String(req.params.codeId).trim();
    const stock = await StocksList.findOne({ code_id: codeId }).lean();
    if (!stock) {
      return error(res, 'Stock not found', 404);
    }

    return success(res, stock, 'Stock fetched');
  })
);

/**
 * @swagger
 * /api/v1/stocks/batch/codes:
 *   get:
 *     summary: Get stock codes (batch)
 *     tags: [Stocks]
 *     security:
 *       - batchKey: []
 *     responses:
 *       200:
 *         description: Stock codes fetched
 */
router.get(
  '/batch/codes',
  batchAuthMiddleware,
  asyncHandler(async (req, res) => {
    const stocks = await StocksList.find({ market: 'NSE' }).select('code_id').lean();
    const codes = stocks.map((item) => item.code_id).filter(Boolean);
    return success(res, codes, 'Stock codes fetched');
  })
);

/**
 * @swagger
 * /api/v1/stocks:
 *   post:
 *     summary: Upsert stocks (batch)
 *     tags: [Stocks]
 *     security:
 *       - batchKey: []
 *     requestBody:
 *       required: true
 *     responses:
 *       200:
 *         description: Stocks upserted
 */
router.post(
  '/',
  batchAuthMiddleware,
  [
    body().custom((value) => {
      if (!Array.isArray(value) && (value === null || typeof value !== 'object')) {
        throw new Error('Body must be an object or array');
      }
      const items = Array.isArray(value) ? value : [value];
      items.forEach((item, index) => {
        if (!item || typeof item !== 'object') {
          throw new Error(`Item at index ${index} must be an object`);
        }
        if (!item.code_id || String(item.code_id).trim().length === 0) {
          throw new Error(`code_id is required at index ${index}`);
        }
        if (!item.market || String(item.market).trim().length === 0) {
          throw new Error(`market is required at index ${index}`);
        }
        if (!item.name || String(item.name).trim().length === 0) {
          throw new Error(`name is required at index ${index}`);
        }
        if (!item.updateSource || String(item.updateSource).trim().length === 0) {
          throw new Error(`updateSource is required at index ${index}`);
        }
      });
      return true;
    }),
  ],
  asyncHandler(async (req, res) => {
    const validationError = validateRequest(req, res);
    if (validationError) {
      return;
    }

    const payload = Array.isArray(req.body) ? req.body : [req.body];
    const ops = payload.map((item) => {
      const updateDoc = {
        code_id: String(item.code_id).trim(),
        market: String(item.market).trim(),
        name: String(item.name).trim(),
        updateSource: String(item.updateSource).trim(),
        updateTime: item.updateTime ? String(item.updateTime).trim() : nowTimestamp(),
        n50_f: item.n50_f !== undefined ? Number(item.n50_f) : 0,
        n500_f: item.n500_f !== undefined ? Number(item.n500_f) : 0,
      };

      return {
        updateOne: {
          filter: { code_id: updateDoc.code_id, market: updateDoc.market },
          update: { $set: updateDoc },
          upsert: true,
        },
      };
    });

    const result = await StocksList.bulkWrite(ops, { ordered: false });
    const upserted = result.upsertedCount || 0;
    const modified = result.modifiedCount || 0;

    return success(res, { upserted, modified }, 'Stocks upserted');
  })
);

module.exports = router;
