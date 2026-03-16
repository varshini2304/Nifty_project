// backend/tests/monitor.test.js
const request = require('supertest');
const jwt = require('jsonwebtoken');
const { setupEnv, connectDb, disconnectDb, clearCollections } = require('./testUtils');
const TradesList = require('../src/models/TradesList');
const StocksPriceList = require('../src/models/StocksPriceList');
const Counter = require('../src/models/Counter');
const { nowTimestamp } = require('../src/utils/dateUtils');

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
});

test('GET /monitor/pl without date returns 400', async () => {
  const response = await request(app)
    .get('/api/v1/monitor/pl')
    .set('Authorization', authHeader());

  expect(response.status).toBe(400);
});

test('GET /monitor/pl?date=99999999 returns 400', async () => {
  const response = await request(app)
    .get('/api/v1/monitor/pl?date=99999999')
    .set('Authorization', authHeader());

  expect(response.status).toBe(400);
});

test('GET /monitor/pl?date=<valid> with no trades returns empty array', async () => {
  const response = await request(app)
    .get('/api/v1/monitor/pl?date=20260316')
    .set('Authorization', authHeader());

  expect(response.status).toBe(200);
  expect(response.body.data.length).toBe(0);
});

test('GET /monitor/pl calculates positionT correctly', async () => {
  await TradesList.create({
    tradeNo: 1000,
    code: 'TCS',
    name: 'Tata Consultancy Services Limited',
    tradeDate: 20260314,
    side: 'B',
    tradePrice: 100,
    quantity: 10,
    updateSource: 'seed',
    updateTime: nowTimestamp(),
    isDeleted: 0,
  });

  const response = await request(app)
    .get('/api/v1/monitor/pl?date=20260316')
    .set('Authorization', authHeader());

  expect(response.status).toBe(200);
  expect(response.body.data[0].positionT).toBe(10);
});

test('GET /monitor/pl calculates cashflow correctly (today trades only)', async () => {
  await TradesList.create([
    {
      tradeNo: 1000,
      code: 'TCS',
      name: 'Tata Consultancy Services Limited',
      tradeDate: 20260315,
      side: 'B',
      tradePrice: 100,
      quantity: 10,
      updateSource: 'seed',
      updateTime: nowTimestamp(),
      isDeleted: 0,
    },
    {
      tradeNo: 1001,
      code: 'TCS',
      name: 'Tata Consultancy Services Limited',
      tradeDate: 20260316,
      side: 'S',
      tradePrice: 110,
      quantity: 2,
      updateSource: 'seed',
      updateTime: nowTimestamp(),
      isDeleted: 0,
    },
  ]);

  const response = await request(app)
    .get('/api/v1/monitor/pl?date=20260316')
    .set('Authorization', authHeader());

  expect(response.status).toBe(200);
  expect(response.body.data[0].cashflow).toBe(220);
});

test('GET /monitor/pl calculates tradePL correctly (all-time)', async () => {
  await TradesList.create([
    {
      tradeNo: 1000,
      code: 'TCS',
      name: 'Tata Consultancy Services Limited',
      tradeDate: 20260314,
      side: 'B',
      tradePrice: 100,
      quantity: 10,
      updateSource: 'seed',
      updateTime: nowTimestamp(),
      isDeleted: 0,
    },
    {
      tradeNo: 1001,
      code: 'TCS',
      name: 'Tata Consultancy Services Limited',
      tradeDate: 20260316,
      side: 'S',
      tradePrice: 110,
      quantity: 3,
      updateSource: 'seed',
      updateTime: nowTimestamp(),
      isDeleted: 0,
    },
  ]);

  const response = await request(app)
    .get('/api/v1/monitor/pl?date=20260316')
    .set('Authorization', authHeader());

  expect(response.status).toBe(200);
  expect(response.body.data[0].tradePL).toBe(-670);
});

test('GET /monitor/pl returns pctChange=0 when priceT1=0', async () => {
  await TradesList.create({
    tradeNo: 1000,
    code: 'TCS',
    name: 'Tata Consultancy Services Limited',
    tradeDate: 20260314,
    side: 'B',
    tradePrice: 100,
    quantity: 10,
    updateSource: 'seed',
    updateTime: nowTimestamp(),
    isDeleted: 0,
  });

  await StocksPriceList.create({
    dt: 20260316,
    code: 'TCS',
    market: 'NSE',
    price: 115,
    priceClose: 112,
    updateSource: 'seed',
    updateTime: nowTimestamp(),
  });

  const response = await request(app)
    .get('/api/v1/monitor/pl?date=20260316')
    .set('Authorization', authHeader());

  expect(response.status).toBe(200);
  expect(response.body.data[0].pctChange).toBe(0);
});

test('GET /monitor/pl returns priceT=0 when no price record found', async () => {
  await TradesList.create({
    tradeNo: 1000,
    code: 'TCS',
    name: 'Tata Consultancy Services Limited',
    tradeDate: 20260314,
    side: 'B',
    tradePrice: 100,
    quantity: 10,
    updateSource: 'seed',
    updateTime: nowTimestamp(),
    isDeleted: 0,
  });

  const response = await request(app)
    .get('/api/v1/monitor/pl?date=20260316')
    .set('Authorization', authHeader());

  expect(response.status).toBe(200);
  expect(response.body.data[0].priceT).toBe(0);
});

test('Full integration: verify all 13 fields match expected values', async () => {
  const t = 20260316;
  const t1 = 20260315;

  await TradesList.create([
    {
      tradeNo: 1000,
      code: 'TCS',
      name: 'Tata Consultancy Services Limited',
      tradeDate: 20260314,
      side: 'B',
      tradePrice: 100,
      quantity: 10,
      updateSource: 'seed',
      updateTime: nowTimestamp(),
      isDeleted: 0,
    },
    {
      tradeNo: 1001,
      code: 'TCS',
      name: 'Tata Consultancy Services Limited',
      tradeDate: t,
      side: 'S',
      tradePrice: 110,
      quantity: 3,
      updateSource: 'seed',
      updateTime: nowTimestamp(),
      isDeleted: 0,
    },
  ]);

  await StocksPriceList.create([
    {
      dt: t,
      code: 'TCS',
      market: 'NSE',
      price: 115,
      priceClose: 112,
      updateSource: 'seed',
      updateTime: nowTimestamp(),
    },
    {
      dt: t1,
      code: 'TCS',
      market: 'NSE',
      price: 108,
      priceClose: 105,
      updateSource: 'seed',
      updateTime: nowTimestamp(),
    },
  ]);

  const response = await request(app)
    .get(`/api/v1/monitor/pl?date=${t}`)
    .set('Authorization', authHeader());

  expect(response.status).toBe(200);
  const row = response.body.data[0];

  expect(row.code).toBe('TCS');
  expect(row.positionT).toBe(7);
  expect(row.positionT1).toBe(10);
  expect(row.tradePrice).toBe(110);
  expect(row.cashflow).toBe(330);
  expect(row.priceT).toBe(115);
  expect(row.priceT1).toBe(105);
  expect(row.pctChange).toBe(9.52);
  expect(row.pricePL).toBe(-245);
  expect(row.pl).toBe(85);
  expect(row.tradePL).toBe(-670);
  expect(row.totalPL).toBe(-915);
});
