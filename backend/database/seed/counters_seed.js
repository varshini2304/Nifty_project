// backend/database/seed/counters_seed.js
const mongoose = require('mongoose');
const path = require('path');
const dotenv = require('dotenv');
const Counter = require('../../src/models/Counter');

dotenv.config({ path: path.resolve(process.cwd(), '.env') });

const run = async () => {
  if (!process.env.MONGODB_URI) {
    throw new Error('MONGODB_URI is required');
  }

  await mongoose.connect(process.env.MONGODB_URI);
  await Counter.findOneAndUpdate(
    { _id: 'tradeNo' },
    { $set: { seq: 999 } },
    { upsert: true, new: true }
  );
  console.log('Counter seed completed');
  await mongoose.disconnect();
};

run().catch((err) => {
  console.error(err);
  process.exit(1);
});
