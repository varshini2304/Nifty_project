// backend/tests/trades.test.js
const request = require('supertest');
const jwt = require('jsonwebtoken');
const { setupEnv, connectDb, disconnectDb, clearCollections } = require('./testUtils');
const TradesList = require('../src/models/TradesList');
const StocksList = require('../src/models/StocksList');
const Counter = require('../src/models/Counter');
const { nowTimestamp, todayYYYYMMDD } = require('../src/utils/dateUtils');

setupEnv();
const { app } = require('../src/app');

const authHeader = () => {
  const token = jwt.sign(
    { username: process.env.NICHIN_USERNAME, role: 'admin' },
    process.env.JWT_SECRET,
    { algorithm: 'HS256', expiresIn: '60m' }
  );
  return `Bearer ${token}`;
};

beforeAll(async () => {
  await connectDb();
});

afterAll(async () => {
  await disconnectDb();
});

beforeEach(async () => {
  await clearCollections();
  await Counter.findOneAndUpdate(
    { _id: 'tradeNo' },
    { $set: { seq: 999 } },
    { upsert: true, new: true }
  );
  await StocksList.create({
    code_id: 'TCS',
    market: 'NSE',
    name: 'Tata Consultancy Services Limited',
    updateSource: 'seed',
    updateTime: nowTimestamp(),
    n50_f: 1,
    n500_f: 1,
  });
});

test('POST /trades creates a trade with tradeNo assigned', async () => {
  const response = await request(app)
    .post('/api/v1/trades')
    .set('Authorization', authHeader())
    .send({
      code: 'TCS',
      name: 'Tata Consultancy Services Limited',
      tradeDate: todayYYYYMMDD(),
      side: 'B',
      tradePrice: 100.5,
      quantity: 10,
      updateSource: 'test',
    });

  expect(response.status).toBe(201);
  expect(response.body.success).toBe(true);
  expect(response.body.data.tradeNo).toBeDefined();
});

test('POST /trades fails when code is missing', async () => {
  const response = await request(app)
    .post('/api/v1/trades')
    .set('Authorization', authHeader())
    .send({
      name: 'Tata Consultancy Services Limited',
      tradeDate: todayYYYYMMDD(),
      side: 'B',
      tradePrice: 100.5,
      quantity: 10,
      updateSource: 'test',
    });

  expect(response.status).toBe(400);
  expect(response.body.success).toBe(false);
});

test('POST /trades fails for future tradeDate', async () => {
  const futureDate = todayYYYYMMDD() + 1;
  const response = await request(app)
    .post('/api/v1/trades')
    .set('Authorization', authHeader())
    .send({
      code: 'TCS',
      name: 'Tata Consultancy Services Limited',
      tradeDate: futureDate,
      side: 'B',
      tradePrice: 100.5,
      quantity: 10,
      updateSource: 'test',
    });

  expect(response.status).toBe(400);
  expect(response.body.success).toBe(false);
});

test('DELETE /trades/:tradeNo soft-deletes trade', async () => {
  const counter = await Counter.findOneAndUpdate(
    { _id: 'tradeNo' },
    { $inc: { seq: 1 } },
    { new: true, upsert: true }
  );

  const trade = await TradesList.create({
    tradeNo: counter.seq,
    code: 'TCS',
    name: 'Tata Consultancy Services Limited',
    tradeDate: todayYYYYMMDD(),
    side: 'B',
    tradePrice: 100,
    quantity: 5,
    updateSource: 'test',
    updateTime: nowTimestamp(),
    isDeleted: 0,
  });

  const response = await request(app)
    .delete(`/api/v1/trades/${trade.tradeNo}`)
    .set('Authorization', authHeader());

  expect(response.status).toBe(200);
  const updated = await TradesList.findOne({ tradeNo: trade.tradeNo }).lean();
  expect(updated).toBeTruthy();
  expect(updated.isDeleted).toBe(1);
});

test('POST /trades/batch-save inserts and updates in one transaction', async () => {
  const counter = await Counter.findOneAndUpdate(
    { _id: 'tradeNo' },
    { $inc: { seq: 1 } },
    { new: true, upsert: true }
  );

  const existing = await TradesList.create({
    tradeNo: counter.seq,
    code: 'TCS',
    name: 'Tata Consultancy Services Limited',
    tradeDate: todayYYYYMMDD(),
    side: 'B',
    tradePrice: 100,
    quantity: 5,
    updateSource: 'seed',
    updateTime: nowTimestamp(),
    isDeleted: 0,
  });

  const response = await request(app)
    .post('/api/v1/trades/batch-save')
    .set('Authorization', authHeader())
    .send([
      {
        tradeNo: existing.tradeNo,
        code: 'TCS',
        name: 'Tata Consultancy Services Limited',
        tradeDate: todayYYYYMMDD(),
        side: 'S',
        tradePrice: 105,
        quantity: 2,
        updateSource: 'test',
      },
      {
        code: 'TCS',
        name: 'Tata Consultancy Services Limited',
        tradeDate: todayYYYYMMDD(),
        side: 'B',
        tradePrice: 110,
        quantity: 1,
        updateSource: 'test',
      },
    ]);

  expect(response.status).toBe(200);
  expect(response.body.data.inserted).toBe(1);
  expect(response.body.data.updated).toBe(1);
});

test('POST /trades/batch-save rolls back on error', async () => {
  const response = await request(app)
    .post('/api/v1/trades/batch-save')
    .set('Authorization', authHeader())
    .send([
      {
        code: 'TCS',
        name: 'Tata Consultancy Services Limited',
        tradeDate: todayYYYYMMDD(),
        side: 'B',
        tradePrice: 110,
        quantity: 1,
        updateSource: 'test',
      },
      {
        tradeNo: 9999,
        code: 'TCS',
        name: 'Tata Consultancy Services Limited',
        tradeDate: todayYYYYMMDD(),
        side: 'B',
        tradePrice: 110,
        quantity: 1,
        updateSource: 'test',
      },
    ]);

  expect(response.status).toBe(404);

  const trades = await TradesList.find({}).lean();
  expect(trades.length).toBe(0);
});
