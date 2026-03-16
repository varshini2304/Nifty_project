// backend/tests/auth.test.js
const request = require('supertest');
const jwt = require('jsonwebtoken');
const { setupEnv, connectDb, disconnectDb, clearCollections } = require('./testUtils');

setupEnv();
const { app } = require('../src/app');

beforeAll(async () => {
  await connectDb();
});

afterAll(async () => {
  await disconnectDb();
});

beforeEach(async () => {
  await clearCollections();
});

test('POST /auth/login returns token with valid credentials', async () => {
  const response = await request(app)
    .post('/api/v1/auth/login')
    .send({ username: process.env.NICHIN_USERNAME, password: 'password123' });

  expect(response.status).toBe(200);
  expect(response.body.success).toBe(true);
  expect(response.body.data.accessToken).toBeDefined();
});

test('POST /auth/login rejects invalid credentials', async () => {
  const response = await request(app)
    .post('/api/v1/auth/login')
    .send({ username: process.env.NICHIN_USERNAME, password: 'wrongpass' });

  expect(response.status).toBe(401);
  expect(response.body.success).toBe(false);
});

test('GET /auth/me returns user with valid token', async () => {
  const token = jwt.sign(
    { username: process.env.NICHIN_USERNAME, role: 'admin' },
    process.env.JWT_SECRET,
    { algorithm: 'HS256', expiresIn: '60m' }
  );

  const response = await request(app)
    .get('/api/v1/auth/me')
    .set('Authorization', `Bearer ${token}`);

  expect(response.status).toBe(200);
  expect(response.body.success).toBe(true);
  expect(response.body.data.username).toBe(process.env.NICHIN_USERNAME);
});

test('GET /auth/me requires token', async () => {
  const response = await request(app).get('/api/v1/auth/me');
  expect(response.status).toBe(401);
  expect(response.body.success).toBe(false);
});

test('GET /health returns status', async () => {
  const response = await request(app).get('/api/v1/health');
  expect(response.status).toBe(200);
  expect(response.body.success).toBe(true);
  expect(response.body.data.status).toBe('ok');
});
