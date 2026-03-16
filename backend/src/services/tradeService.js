// backend/src/services/tradeService.js
const Counter = require('../models/Counter');
const TradesList = require('../models/TradesList');
const { nowTimestamp } = require('../utils/dateUtils');

const nextTradeNo = async () => {
  const counter = await Counter.findOneAndUpdate(
    { _id: 'tradeNo' },
    { $inc: { seq: 1 } },
    { new: true, upsert: true }
  );
  return counter.seq;
};

const getTradesByStock = async (code, asOfDate) => {
  return TradesList.find({ code, tradeDate: { $lte: asOfDate }, isDeleted: 0 })
    .sort({ tradeDate: 1 })
    .lean();
};

const buildTradeDoc = (payload, tradeNo) => {
  return {
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
  };
};

module.exports = {
  nextTradeNo,
  getTradesByStock,
  buildTradeDoc,
};
