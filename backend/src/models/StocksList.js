// backend/src/models/StocksList.js
const mongoose = require('mongoose');

const StocksListSchema = new mongoose.Schema(
  {
    code_id: { type: String, required: true, trim: true },
    market: { type: String, required: true, trim: true },
    name: { type: String, required: true, trim: true },
    updateSource: { type: String, required: true, trim: true },
    updateTime: { type: String, required: true, trim: true },
    n50_f: { type: Number, required: true, default: 0 },
    n500_f: { type: Number, required: true, default: 0 },
  },
  {
    strict: true,
    collection: 'stockslists',
  }
);

StocksListSchema.index({ code_id: 1, market: 1 }, { unique: true });

module.exports = mongoose.model('StocksList', StocksListSchema);
