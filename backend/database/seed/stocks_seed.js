// backend/database/seed/stocks_seed.js
const mongoose = require('mongoose');
const path = require('path');
const dotenv = require('dotenv');
const StocksList = require('../../src/models/StocksList');
const { nowTimestamp } = require('../../src/utils/dateUtils');

dotenv.config({ path: path.resolve(process.cwd(), '.env') });

const sampleStocks = [
  { code_id: 'TATAMOTORS', name: 'Tata Motors Limited' },
  { code_id: 'RELIANCE', name: 'Reliance Industries Limited' },
  { code_id: 'TCS', name: 'Tata Consultancy Services Limited' },
  { code_id: 'HDFCBANK', name: 'HDFC Bank Limited' },
  { code_id: 'INFY', name: 'Infosys Limited' },
  { code_id: 'ICICIBANK', name: 'ICICI Bank Limited' },
  { code_id: 'SBIN', name: 'State Bank of India' },
  { code_id: 'BAJFINANCE', name: 'Bajaj Finance Limited' },
  { code_id: 'ASIANPAINT', name: 'Asian Paints Limited' },
  { code_id: 'BEL', name: 'Bharat Electronics Limited' },
];

const run = async () => {
  if (!process.env.MONGODB_URI) {
    throw new Error('MONGODB_URI is required');
  }

  await mongoose.connect(process.env.MONGODB_URI);

  const updateTime = nowTimestamp();
  const ops = sampleStocks.map((stock) => ({
    updateOne: {
      filter: { code_id: stock.code_id, market: 'NSE' },
      update: {
        $set: {
          code_id: stock.code_id,
          market: 'NSE',
          name: stock.name,
          updateSource: 'seed',
          updateTime,
          n50_f: 1,
          n500_f: 1,
        },
      },
      upsert: true,
    },
  }));

  await StocksList.bulkWrite(ops);
  console.log('Stocks seed completed');
  await mongoose.disconnect();
};

run().catch((err) => {
  console.error(err);
  process.exit(1);
});
