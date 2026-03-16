// backend/tests/prices.test.js
const request = require('supertest');
const jwt = require('jsonwebtoken');
const { setupEnv, connectDb, disconnectDb, clearCollections } = require('./testUtils');
const StocksPriceList = require('../src/models/StocksPriceList');
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
  await StocksPriceList.create([
    {
      dt: 20260316,
      code: 'TCS',
      market: 'NSE',
      price: 115,
      priceClose: 112,
      updateSource: 'seed',
      updateTime: nowTimestamp(),
    },
    {
      dt: 20260315,
      code: 'TCS',
      market: 'NSE',
      price: 108,
      priceClose: 105,
      updateSource: 'seed',
      updateTime: nowTimestamp(),
    },
  ]);
});

test('GET /prices?dt=20260316 returns price records', async () => {
  const response = await request(app)
    .get('/api/v1/prices?dt=20260316')
    .set('Authorization', authHeader());

  expect(response.status).toBe(200);
  expect(response.body.data.length).toBe(1);
});

test('GET /prices without dt returns 400', async () => {
  const response = await request(app)
    .get('/api/v1/prices')
    .set('Authorization', authHeader());

  expect(response.status).toBe(400);
});

test('POST /prices/batch-upsert with X-Batch-Key inserts records', async () => {
  const response = await request(app)
    .post('/api/v1/prices/batch-upsert')
    .set('X-Batch-Key', process.env.BATCH_API_KEY)
    .send([
      {
        dt: 20260317,
        code: 'TCS',
        market: 'NSE',
        price: 120,
        priceClose: 118,
        updateSource: 'batch',
      },
    ]);

  expect(response.status).toBe(200);
  expect(response.body.data.upserted).toBe(1);
});

test('POST /prices/batch-upsert without key returns 401', async () => {
  const response = await request(app)
    .post('/api/v1/prices/batch-upsert')
    .send([
      {
        dt: 20260317,
        code: 'TCS',
        market: 'NSE',
        price: 120,
        priceClose: 118,
        updateSource: 'batch',
      },
    ]);

  expect(response.status).toBe(401);
});

test('GET /prices/latest?code=TCS returns most recent record', async () => {
  const response = await request(app)
    .get('/api/v1/prices/latest?code=TCS')
    .set('Authorization', authHeader());

  expect(response.status).toBe(200);
  expect(response.body.data.dt).toBe(20260316);
});

test('GET /prices/dates returns sorted array of date integers', async () => {
  const response = await request(app)
    .get('/api/v1/prices/dates')
    .set('Authorization', authHeader());

  expect(response.status).toBe(200);
  expect(response.body.data[0]).toBe(20260316);
  expect(response.body.data[1]).toBe(20260315);
});
