// backend/tests/stocks.test.js
const request = require('supertest');
const jwt = require('jsonwebtoken');
const { setupEnv, connectDb, disconnectDb, clearCollections } = require('./testUtils');
const StocksList = require('../src/models/StocksList');
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
  await StocksList.create([
    {
      code_id: 'TCS',
      market: 'NSE',
      name: 'Tata Consultancy Services Limited',
      updateSource: 'seed',
      updateTime: nowTimestamp(),
      n50_f: 1,
      n500_f: 1,
    },
    {
      code_id: 'INFY',
      market: 'NSE',
      name: 'Infosys Limited',
      updateSource: 'seed',
      updateTime: nowTimestamp(),
      n50_f: 0,
      n500_f: 1,
    },
  ]);
});

test('GET /stocks returns all stocks', async () => {
  const response = await request(app)
    .get('/api/v1/stocks')
    .set('Authorization', authHeader());

  expect(response.status).toBe(200);
  expect(response.body.data.length).toBe(2);
});

test('GET /stocks?n50_f=1 filters correctly', async () => {
  const response = await request(app)
    .get('/api/v1/stocks?n50_f=1')
    .set('Authorization', authHeader());

  expect(response.status).toBe(200);
  expect(response.body.data.length).toBe(1);
  expect(response.body.data[0].code_id).toBe('TCS');
});

test('GET /stocks/search?q=TAT returns matching stocks', async () => {
  const response = await request(app)
    .get('/api/v1/stocks/search?q=INF')
    .set('Authorization', authHeader());

  expect(response.status).toBe(200);
  expect(response.body.data.length).toBe(1);
  expect(response.body.data[0].code_id).toBe('INFY');
});

test('GET /stocks/search?q=X (1 char) returns 400', async () => {
  const response = await request(app)
    .get('/api/v1/stocks/search?q=X')
    .set('Authorization', authHeader());

  expect(response.status).toBe(400);
});

test('GET /stocks/:codeId returns 404 for unknown code', async () => {
  const response = await request(app)
    .get('/api/v1/stocks/UNKNOWN')
    .set('Authorization', authHeader());

  expect(response.status).toBe(404);
});

test('POST /stocks with valid X-Batch-Key upserts stock', async () => {
  const response = await request(app)
    .post('/api/v1/stocks')
    .set('X-Batch-Key', process.env.BATCH_API_KEY)
    .send({
      code_id: 'RELIANCE',
      market: 'NSE',
      name: 'Reliance Industries Limited',
      updateSource: 'batch',
    });

  expect(response.status).toBe(200);
  expect(response.body.data.upserted).toBe(1);
});

test('POST /stocks without X-Batch-Key returns 401', async () => {
  const response = await request(app)
    .post('/api/v1/stocks')
    .send({
      code_id: 'RELIANCE',
      market: 'NSE',
      name: 'Reliance Industries Limited',
      updateSource: 'batch',
    });

  expect(response.status).toBe(401);
});
