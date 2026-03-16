// backend/src/models/StocksPriceList.js
const mongoose = require('mongoose');

const StocksPriceListSchema = new mongoose.Schema(
  {
    dt: { type: Number, required: true },
    code: { type: String, required: true, trim: true },
    market: { type: String, required: true, trim: true },
    price: { type: Number, required: true },
    priceClose: { type: Number },
    updateSource: { type: String, required: true, trim: true },
    updateTime: { type: String, required: true, trim: true },
  },
  {
    strict: true,
    collection: 'stockspricelists',
  }
);

StocksPriceListSchema.index({ dt: 1, code: 1, market: 1 }, { unique: true });
StocksPriceListSchema.index({ code: 1, dt: -1 });

module.exports = mongoose.model('StocksPriceList', StocksPriceListSchema);
