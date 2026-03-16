// backend/src/routes/trades.js
const express = require('express');
const mongoose = require('mongoose');
const multer = require('multer');
const { parse } = require('fast-csv');
const { Readable } = require('stream');
const { body, param, query } = require('express-validator');
const { asyncHandler } = require('../utils/asyncHandler');
const { validateRequest } = require('../utils/validateRequest');
const { success, error } = require('../utils/apiResponse');
const { todayYYYYMMDD, nowTimestamp, isValidYYYYMMDD } = require('../utils/dateUtils');
const { authMiddleware } = require('../middleware/authMiddleware');
const { logger } = require('../utils/logger');
const TradesList = require('../models/TradesList');
const StocksList = require('../models/StocksList');
const Counter = require('../models/Counter');

const router = express.Router();

const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 5 * 1024 * 1024 },
  fileFilter: (req, file, cb) => {
    const isCsv = file.mimetype === 'text/csv' || file.mimetype === 'application/vnd.ms-excel' || file.originalname.toLowerCase().endsWith('.csv');
    cb(isCsv ? null : new Error('Only CSV files are allowed'), isCsv);
  },
});

const validateTradeDate = (value) => {
  if (!isValidYYYYMMDD(value)) {
    throw new Error('Invalid tradeDate');
  }
  const dateNum = Number(value);
  if (dateNum > todayYYYYMMDD()) {
    throw new Error('tradeDate cannot be in the future');
  }
  return true;
};

const validateTradePayload = async (payload) => {
  const requiredFields = ['code', 'name', 'tradeDate', 'side', 'tradePrice', 'quantity', 'updateSource'];
  for (const field of requiredFields) {
    if (payload[field] === undefined || payload[field] === null || payload[field] === '') {
      throw new Error(`Missing field: ${field}`);
    }
  }

  if (!['B', 'S'].includes(String(payload.side).toUpperCase())) {
    throw new Error('Invalid side');
  }

  validateTradeDate(payload.tradeDate);

  const price = Number(payload.tradePrice);
  if (!Number.isFinite(price) || price <= 0) {
    throw new Error('Invalid tradePrice');
  }

  const quantity = Number(payload.quantity);
  if (!Number.isInteger(quantity) || quantity <= 0) {
    throw new Error('Invalid quantity');
  }

  const code = String(payload.code).trim();
  const exists = await StocksList.findOne({ code_id: code }).lean();
  if (!exists) {
    throw new Error('Invalid code');
  }
};

const buildTradeDoc = (payload, tradeNo) => ({
  tradeNo,
  code: String(payload.code).trim(),
  name: String(payload.name).trim(),
  tradeDate: Number(payload.tradeDate),
  side: String(payload.side).trim().toUpperCase(),
  tradePrice: Number(payload.tradePrice),
  quantity: Number(payload.quantity),
  updateSource: String(payload.updateSource).trim(),
  updateTime: nowTimestamp(),
  isDeleted: 0,
});

const performBatchSave = async (trades, session) => {
  let inserted = 0;
  let updated = 0;

  for (const trade of trades) {
    if (trade.tradeNo) {
      const updateData = {
        code: String(trade.code).trim(),
        name: String(trade.name).trim(),
        tradeDate: Number(trade.tradeDate),
        side: String(trade.side).trim().toUpperCase(),
        tradePrice: Number(trade.tradePrice),
        quantity: Number(trade.quantity),
        updateSource: String(trade.updateSource).trim(),
        updateTime: nowTimestamp(),
      };

      const updatedDoc = await TradesList.findOneAndUpdate(
        { tradeNo: Number(trade.tradeNo) },
        updateData,
        { new: true, runValidators: true, session }
      );

      if (!updatedDoc) {
        const notFound = new Error(`Trade not found: ${trade.tradeNo}`);
        notFound.status = 404;
        throw notFound;
      }
      updated += 1;
    } else {
      const counter = await Counter.findOneAndUpdate(
        { _id: 'tradeNo' },
        { $inc: { seq: 1 } },
        { new: true, upsert: true, session }
      );

      const doc = buildTradeDoc(trade, counter.seq);
      await TradesList.create([doc], { session });
      inserted += 1;
    }
  }

  return { inserted, updated };
};

router.use(authMiddleware);

router.get(
  '/',
  [query('includeDeleted').optional().isBoolean().withMessage('includeDeleted must be boolean')],
  asyncHandler(async (req, res) => {
    const validationError = validateRequest(req, res);
    if (validationError) {
      return;
    }

    const includeDeleted = String(req.query.includeDeleted || 'false') === 'true';
    const filter = includeDeleted ? {} : { isDeleted: 0 };
    const trades = await TradesList.find(filter).sort({ tradeNo: -1 }).lean();
    return success(res, trades, 'Trades fetched');
  })
);

router.post(
  '/',
  [
    body('tradeNo').custom((value) => {
      if (value !== undefined) {
        throw new Error('tradeNo must not be supplied');
      }
      return true;
    }),
    body('code').trim().notEmpty().withMessage('code is required'),
    body('name').trim().notEmpty().withMessage('name is required'),
    body('tradeDate').custom(validateTradeDate),
    body('side').trim().toUpperCase().isIn(['B', 'S']).withMessage('side must be B or S'),
    body('tradePrice').isFloat({ gt: 0 }).withMessage('tradePrice must be > 0'),
    body('quantity').isInt({ gt: 0 }).withMessage('quantity must be > 0'),
    body('updateSource').trim().notEmpty().withMessage('updateSource is required'),
    body('code').custom(async (value) => {
      const exists = await StocksList.findOne({ code_id: value }).lean();
      if (!exists) {
        throw new Error('Invalid code');
      }
      return true;
    }),
  ],
  asyncHandler(async (req, res) => {
    const validationError = validateRequest(req, res);
    if (validationError) {
      return;
    }

    const counter = await Counter.findOneAndUpdate(
      { _id: 'tradeNo' },
      { $inc: { seq: 1 } },
      { new: true, upsert: true }
    );

    const tradeDoc = buildTradeDoc(req.body, counter.seq);
    const created = await TradesList.create(tradeDoc);
    logger.info(`TRADE_CREATED tradeNo=${created.tradeNo} by ${req.user.username} at ${created.updateTime}`);

    return success(res, created, 'Trade created', 201);
  })
);

router.put(
  '/:tradeNo',
  [
    param('tradeNo').isInt({ gt: 0 }).withMessage('tradeNo must be a positive integer'),
    body('code').trim().notEmpty().withMessage('code is required'),
    body('name').trim().notEmpty().withMessage('name is required'),
    body('tradeDate').custom(validateTradeDate),
    body('side').trim().toUpperCase().isIn(['B', 'S']).withMessage('side must be B or S'),
    body('tradePrice').isFloat({ gt: 0 }).withMessage('tradePrice must be > 0'),
    body('quantity').isInt({ gt: 0 }).withMessage('quantity must be > 0'),
    body('updateSource').trim().notEmpty().withMessage('updateSource is required'),
    body('code').custom(async (value) => {
      const exists = await StocksList.findOne({ code_id: value }).lean();
      if (!exists) {
        throw new Error('Invalid code');
      }
      return true;
    }),
  ],
  asyncHandler(async (req, res) => {
    const validationError = validateRequest(req, res);
    if (validationError) {
      return;
    }

    const updateData = {
      code: String(req.body.code).trim(),
      name: String(req.body.name).trim(),
      tradeDate: Number(req.body.tradeDate),
      side: String(req.body.side).trim().toUpperCase(),
      tradePrice: Number(req.body.tradePrice),
      quantity: Number(req.body.quantity),
      updateSource: String(req.body.updateSource).trim(),
      updateTime: nowTimestamp(),
    };

    const updated = await TradesList.findOneAndUpdate(
      { tradeNo: Number(req.params.tradeNo) },
      updateData,
      { new: true, runValidators: true }
    );

    if (!updated) {
      return error(res, 'Trade not found', 404);
    }

    logger.info(`TRADE_UPDATED tradeNo=${updated.tradeNo} by ${req.user.username} at ${updated.updateTime}`);
    return success(res, updated, 'Trade updated');
  })
);

router.delete(
  '/:tradeNo',
  [param('tradeNo').isInt({ gt: 0 }).withMessage('tradeNo must be a positive integer')],
  asyncHandler(async (req, res) => {
    const validationError = validateRequest(req, res);
    if (validationError) {
      return;
    }

    const updateTime = nowTimestamp();
    const updated = await TradesList.findOneAndUpdate(
      { tradeNo: Number(req.params.tradeNo) },
      { isDeleted: 1, updateTime },
      { new: true }
    );

    if (!updated) {
      return error(res, 'Trade not found', 404);
    }

    logger.info(`TRADE_DELETED tradeNo=${updated.tradeNo} by ${req.user.username} at ${updateTime}`);
    return success(res, null, 'Trade soft-deleted');
  })
);

router.post(
  '/batch-save',
  [
    body().custom(async (value) => {
      if (!Array.isArray(value)) {
        throw new Error('Request body must be an array');
      }
      for (const trade of value) {
        await validateTradePayload(trade);
        if (trade.tradeNo !== undefined && !Number.isInteger(Number(trade.tradeNo))) {
          throw new Error('Invalid tradeNo');
        }
      }
      return true;
    }),
  ],
  asyncHandler(async (req, res) => {
    const validationError = validateRequest(req, res);
    if (validationError) {
      return;
    }

    const session = await mongoose.startSession();
    session.startTransaction();

    try {
      const { inserted, updated } = await performBatchSave(req.body, session);
      await session.commitTransaction();
      session.endSession();
      return success(res, { inserted, updated, errors: [] }, 'Batch save completed');
    } catch (err) {
      await session.abortTransaction();
      session.endSession();
      throw err;
    }
  })
);

router.get(
  '/by-stock/:code',
  // Keep /by-stock/:code and /export-csv ABOVE any /:tradeNo routes to avoid collisions.
  [
    param('code').trim().notEmpty().withMessage('code is required'),
    query('asOfDate').custom((value) => {
      if (!value) {
        throw new Error('asOfDate is required');
      }
      return validateTradeDate(value);
    }),
  ],
  asyncHandler(async (req, res) => {
    const validationError = validateRequest(req, res);
    if (validationError) {
      return;
    }

    const asOfDate = Number(req.query.asOfDate);
    const trades = await TradesList.find({
      code: String(req.params.code).trim(),
      tradeDate: { $lte: asOfDate },
      isDeleted: 0,
    })
      .sort({ tradeDate: 1 })
      .lean();

    return success(res, trades, 'Trades fetched');
  })
);

router.get(
  '/export-csv',
  [query('includeDeleted').optional().isBoolean().withMessage('includeDeleted must be boolean')],
  asyncHandler(async (req, res) => {
    const validationError = validateRequest(req, res);
    if (validationError) {
      return;
    }

    const includeDeleted = String(req.query.includeDeleted || 'false') === 'true';
    const filter = includeDeleted ? {} : { isDeleted: 0 };
    const trades = await TradesList.find(filter).sort({ tradeNo: -1 }).lean();

    const headers = ['tradeNo', 'code', 'name', 'tradeDate', 'side', 'tradePrice', 'quantity', 'updateSource', 'updateTime', 'isDeleted'];
    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', `attachment; filename="trades_${todayYYYYMMDD()}.csv"`);

    const csvStream = require('fast-csv').format({ headers });
    csvStream.pipe(res);
    trades.forEach((trade) => {
      csvStream.write(trade);
    });
    csvStream.end();
  })
);

router.post(
  '/import-csv',
  upload.single('file'),
  [
    body('file').custom((value, { req }) => {
      if (!req.file) {
        throw new Error('CSV file is required');
      }
      return true;
    }),
  ],
  asyncHandler(async (req, res) => {
    const validationError = validateRequest(req, res);
    if (validationError) {
      return;
    }

    const rows = [];
    const errors = [];
    const expectedHeaders = ['tradeNo', 'code', 'name', 'tradeDate', 'side', 'tradePrice', 'quantity', 'updateSource'];

    await new Promise((resolve, reject) => {
      const stream = Readable.from(req.file.buffer);
      stream
        .pipe(parse({ headers: true, ignoreEmpty: true, trim: true }))
        .on('headers', (headers) => {
          const normalized = headers.map((h) => h.trim());
          const missing = expectedHeaders.filter((header) => !normalized.includes(header));
          if (missing.length > 0) {
            reject(new Error(`Missing CSV headers: ${missing.join(', ')}`));
          }
        })
        .on('error', (err) => reject(err))
        .on('data', (row) => {
          rows.push(row);
        })
        .on('end', () => {
          resolve();
        });
    });

    const validTrades = [];
    let skipped = 0;

    for (let i = 0; i < rows.length; i += 1) {
      const row = rows[i];
      try {
        await validateTradePayload(row);
        if (row.tradeNo && !Number.isInteger(Number(row.tradeNo))) {
          throw new Error('Invalid tradeNo');
        }
        validTrades.push(row);
      } catch (err) {
        skipped += 1;
        errors.push({ row: i + 1, reason: err.message });
      }
    }

    if (validTrades.length === 0) {
      return success(res, { imported: 0, skipped, errors }, 'No valid rows to import');
    }

    const session = await mongoose.startSession();
    session.startTransaction();

    try {
      const { inserted, updated } = await performBatchSave(validTrades, session);
      await session.commitTransaction();
      session.endSession();
      return success(res, { imported: inserted + updated, skipped, errors }, 'CSV import completed');
    } catch (err) {
      await session.abortTransaction();
      session.endSession();
      throw err;
    }
  })
);

module.exports = router;
