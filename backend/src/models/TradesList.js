// backend/src/models/TradesList.js
const mongoose = require('mongoose');

const TradesListSchema = new mongoose.Schema(
  {
    tradeNo: { type: Number, required: true, unique: true },
    code: { type: String, required: true, trim: true },
    name: { type: String, required: true, trim: true },
    tradeDate: { type: Number, required: true },
    side: { type: String, required: true, enum: ['B', 'S'] },
    tradePrice: { type: Number, required: true, min: 0.01 },
    quantity: { type: Number, required: true, min: 1 },
    updateSource: { type: String, required: true, trim: true },
    updateTime: { type: String, required: true, trim: true },
    isDeleted: { type: Number, default: 0 },
  },
  {
    strict: true,
    collection: 'tradeslists',
  }
);

TradesListSchema.index({ tradeNo: 1 }, { unique: true });
TradesListSchema.index({ code: 1, tradeDate: 1 });
TradesListSchema.index({ isDeleted: 1 });

module.exports = mongoose.model('TradesList', TradesListSchema);
