// tests/e2e/smoke.test.js
const axios = require('axios');

const API = 'http://localhost:5000/api/v1';
const BATCH_KEY = process.env.BATCH_API_KEY || 'batch-secret';
const USERNAME = process.env.NICHIN_USERNAME || 'nichiuser';
const PASSWORD = process.env.NICHIN_PASSWORD;

let authToken = null;
let createdTradeNo = null;

const getTodayInt = () => {
  const now = new Date();
  const pad = (n) => String(n).padStart(2, '0');
  return Number(`${now.getFullYear()}${pad(now.getMonth() + 1)}${pad(now.getDate())}`);
};

describe('Full Stack Smoke Tests', () => {
  test('Backend health check returns ok', async () => {
    const response = await axios.get(`${API}/health`);
    expect(response.status).toBe(200);
    expect(response.data.data.status).toBe('ok');
    expect(response.data.data.db).toBe('ok');
  });

  test('Login returns JWT token', async () => {
    if (!PASSWORD) {
      throw new Error('NICHIN_PASSWORD must be set in the environment for smoke tests');
    }
    const response = await axios.post(`${API}/auth/login`, {
      username: USERNAME,
      password: PASSWORD,
    });
    expect(response.status).toBe(200);
    expect(response.data.data.accessToken).toBeDefined();
    authToken = response.data.data.accessToken;
  });

  test('GET /stocks returns stock list', async () => {
    const response = await axios.get(`${API}/stocks`, {
      headers: { Authorization: `Bearer ${authToken}` },
    });
    expect(response.status).toBe(200);
    expect(Array.isArray(response.data.data)).toBe(true);
  });

  test('POST /stocks batch upserts with X-Batch-Key', async () => {
    const response = await axios.post(
      `${API}/stocks`,
      [
        {
          code_id: 'SMOKETEST',
          market: 'NSE',
          name: 'Smoke Test Stock',
          updateSource: 'smoke-test',
        },
      ],
      { headers: { 'X-Batch-Key': BATCH_KEY } }
    );
    expect(response.status).toBe(200);
    expect(response.data.data.upserted).toBe(1);
  });

  test('POST /prices/batch-upsert with X-Batch-Key', async () => {
    const response = await axios.post(
      `${API}/prices/batch-upsert`,
      [
        {
          dt: 20260316,
          code: 'SMOKETEST',
          market: 'NSE',
          price: 100,
          priceClose: 99,
          updateSource: 'smoke-test',
        },
      ],
      { headers: { 'X-Batch-Key': BATCH_KEY } }
    );
    expect(response.status).toBe(200);
    expect(response.data.data.upserted).toBe(1);
  });

  test('POST /trades creates trade', async () => {
    const today = getTodayInt();
    const response = await axios.post(
      `${API}/trades`,
      {
        code: 'SMOKETEST',
        name: 'Smoke Test Stock',
        tradeDate: today,
        side: 'B',
        tradePrice: 100,
        quantity: 5,
        updateSource: 'smoke-test',
      },
      { headers: { Authorization: `Bearer ${authToken}` } }
    );
    expect(response.status).toBe(201);
    expect(response.data.data.tradeNo).toBeDefined();
    createdTradeNo = response.data.data.tradeNo;
  });

  test('GET /monitor/pl returns P&L row', async () => {
    const today = getTodayInt();
    const response = await axios.get(`${API}/monitor/pl`, {
      params: { date: today },
      headers: { Authorization: `Bearer ${authToken}` },
    });
    expect(response.status).toBe(200);
    expect(Array.isArray(response.data.data)).toBe(true);
    const row = response.data.data.find((item) => item.code === 'SMOKETEST');
    expect(row).toBeDefined();
    expect(row.positionT).toBe(5);
  });

  test('GET /trades/export-csv returns CSV', async () => {
    const response = await axios.get(`${API}/trades/export-csv`, {
      headers: { Authorization: `Bearer ${authToken}` },
    });
    expect(response.status).toBe(200);
    expect(response.headers['content-type']).toContain('text/csv');
  });

  test('DELETE /trades/:tradeNo soft-deletes', async () => {
    const response = await axios.delete(`${API}/trades/${createdTradeNo}`, {
      headers: { Authorization: `Bearer ${authToken}` },
    });
    expect(response.status).toBe(200);

    const tradesResponse = await axios.get(`${API}/trades`, {
      params: { includeDeleted: true },
      headers: { Authorization: `Bearer ${authToken}` },
    });
    const deleted = tradesResponse.data.data.find((item) => item.tradeNo === createdTradeNo);
    expect(deleted).toBeDefined();
    expect(deleted.isDeleted).toBe(1);
  });
});
