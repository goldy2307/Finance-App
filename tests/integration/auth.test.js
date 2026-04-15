'use strict';

/**
 * Integration tests for POST /api/v1/auth/*
 *
 * These tests spin up the Express app against a real (test) database.
 * Set TEST_DB_URI in your .env.test or CI env.
 *
 * Run: jest tests/integration/auth.test.js
 */

process.env.NODE_ENV  = 'test';
process.env.DB_DRIVER = 'mongo';
process.env.MONGO_URI = process.env.TEST_MONGO_URI || 'mongodb://localhost:27017/cashly_test';
process.env.JWT_SECRET= 'test-jwt-secret-long-enough-for-testing-only';

const request  = require('supertest');
const mongoose = require('mongoose');
const { app, boot } = require('../../src/server');

let server;

beforeAll(async () => {
  server = await boot();
});

afterAll(async () => {
  // Clean up test data
  await mongoose.connection.db.dropDatabase();
  await mongoose.disconnect();
  server.close();
});

// ── Registration ──────────────────────────────────────────────────────────
describe('POST /api/v1/auth/register', () => {
  const payload = {
    firstName: 'Test',
    lastName:  'User',
    email:     'integration@test.com',
    phone:     '9000000001',
    password:  'Password1',
  };

  it('201 — creates user and returns tokens', async () => {
    const res = await request(app).post('/api/v1/auth/register').send(payload);
    expect(res.status).toBe(201);
    expect(res.body.success).toBe(true);
    expect(res.body.data).toHaveProperty('accessToken');
    expect(res.body.data).toHaveProperty('refreshToken');
    expect(res.body.data.user.email).toBe(payload.email);
    // Password must NEVER appear in response
    expect(JSON.stringify(res.body)).not.toContain('Password1');
  });

  it('409 — duplicate email', async () => {
    const res = await request(app).post('/api/v1/auth/register').send(payload);
    expect(res.status).toBe(409);
    expect(res.body.success).toBe(false);
  });

  it('400 — missing required fields', async () => {
    const res = await request(app).post('/api/v1/auth/register').send({ email: 'x@x.com' });
    expect(res.status).toBe(400);
    expect(res.body.error.details).toBeDefined();
  });

  it('400 — weak password (no uppercase)', async () => {
    const res = await request(app).post('/api/v1/auth/register').send({
      ...payload,
      email:    'weak@test.com',
      phone:    '9000000002',
      password: 'allowercase1',
    });
    expect(res.status).toBe(400);
  });
});

// ── Login ─────────────────────────────────────────────────────────────────
describe('POST /api/v1/auth/login', () => {
  it('200 — valid credentials (phone)', async () => {
    const res = await request(app).post('/api/v1/auth/login').send({
      identifier: '9000000001',
      password:   'Password1',
    });
    expect(res.status).toBe(200);
    expect(res.body.data).toHaveProperty('accessToken');
  });

  it('200 — valid credentials (email)', async () => {
    const res = await request(app).post('/api/v1/auth/login').send({
      identifier: 'integration@test.com',
      password:   'Password1',
    });
    expect(res.status).toBe(200);
  });

  it('401 — wrong password', async () => {
    const res = await request(app).post('/api/v1/auth/login').send({
      identifier: '9000000001',
      password:   'WrongPass1',
    });
    expect(res.status).toBe(401);
  });

  it('401 — unknown phone', async () => {
    const res = await request(app).post('/api/v1/auth/login').send({
      identifier: '9999999999',
      password:   'Password1',
    });
    expect(res.status).toBe(401);
  });
});

// ── Protected routes ──────────────────────────────────────────────────────
describe('GET /api/v1/auth/me', () => {
  let token;

  beforeAll(async () => {
    const res = await request(app).post('/api/v1/auth/login').send({
      identifier: 'integration@test.com',
      password:   'Password1',
    });
    token = res.body.data.accessToken;
  });

  it('200 — returns user profile with valid token', async () => {
    const res = await request(app)
      .get('/api/v1/auth/me')
      .set('Authorization', `Bearer ${token}`);
    expect(res.status).toBe(200);
    expect(res.body.data.user.email).toBe('integration@test.com');
  });

  it('401 — no token', async () => {
    const res = await request(app).get('/api/v1/auth/me');
    expect(res.status).toBe(401);
  });

  it('401 — malformed token', async () => {
    const res = await request(app)
      .get('/api/v1/auth/me')
      .set('Authorization', 'Bearer not.a.real.token');
    expect(res.status).toBe(401);
  });
});

// ── Health check ──────────────────────────────────────────────────────────
describe('GET /api/v1/health', () => {
  it('200 — returns ok', async () => {
    const res = await request(app).get('/api/v1/health');
    expect(res.status).toBe(200);
    expect(res.body.status).toBe('ok');
  });
});