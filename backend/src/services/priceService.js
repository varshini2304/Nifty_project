// backend/src/services/priceService.js
const StocksPriceList = require('../models/StocksPriceList');
const { prevDay } = require('../utils/dateUtils');

const getPriceForDate = async (code, dateInt) => {
  return StocksPriceList.findOne({ code, dt: dateInt }).lean();
};

const getPrevTradingDay = (dateInt) => {
  // TODO v2: skip weekends and NSE holidays
  return prevDay(dateInt);
};

module.exports = {
  getPriceForDate,
  getPrevTradingDay,
};
