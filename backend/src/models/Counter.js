// backend/src/models/Counter.js
const mongoose = require('mongoose');

const CounterSchema = new mongoose.Schema(
  {
    _id: { type: String, required: true },
    seq: { type: Number, required: true },
  },
  {
    strict: true,
    collection: 'counters',
  }
);

module.exports = mongoose.model('Counter', CounterSchema);
