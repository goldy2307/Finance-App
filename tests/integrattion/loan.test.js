'use strict';

process.env.NODE_ENV  = 'test';
process.env.DB_DRIVER = 'mongo';
process.env.MONGO_URI = process.env.TEST_MONGO_URI || 'mongodb://localhost:27017/cashly_test';
process.env.JWT_SECRET= 'test-jwt-secret-long-enough-for-testing-only';

const request  = require('supertest');
const mongoose = require('mongoose');
const { app, boot } = require('../../src/server');

let server;
let borrowerToken;
let adminToken;
let loanId;

const BORROWER = {
  firstName: 'Borrower', lastName: 'Test',
  email: 'borrower@loantest.com', phone: '9100000001', password: 'Password1',
};
const ADMIN = {
  firstName: 'Admin', lastName: 'Test',
  email: 'admin@loantest.com', phone: '9100000002', password: 'Password1',
};

beforeAll(async () => {
  server = await boot();

  // Register borrower
  const b = await request(app).post('/api/v1/auth/register').send(BORROWER);
  borrowerToken = b.body.data.accessToken;

  // Register admin, then manually set role (would normally be a DB seed)
  const a = await request(app).post('/api/v1/auth/register').send(ADMIN);
  adminToken = a.body.data.accessToken;
  const adminId = a.body.data.user.id || a.body.data.user._id;
  await mongoose.connection.collection('users').updateOne(
    { _id: new mongoose.Types.ObjectId(adminId) },
    { $set: { role: 'admin' } }
  );
  // Re-login to get a token with admin role
  const adminLogin = await request(app).post('/api/v1/auth/login').send({
    identifier: ADMIN.phone, password: ADMIN.password,
  });
  adminToken = adminLogin.body.data.accessToken;
});

afterAll(async () => {
  await mongoose.connection.db.dropDatabase();
  await mongoose.disconnect();
  server.close();
});

// ── Apply ─────────────────────────────────────────────────────────────────
describe('POST /api/v1/loans', () => {
  it('201 — borrower applies for a personal loan', async () => {
    const res = await request(app)
      .post('/api/v1/loans')
      .set('Authorization', `Bearer ${borrowerToken}`)
      .send({
        loanType:           'personal',
        amountRupees:       300000,
        tenureMonths:       36,
        purpose:            'Medical emergency',
        employmentType:     'salaried',
        monthlyIncomeRupees: 75000,
      });

    expect(res.status).toBe(201);
    expect(res.body.data.loan.status).toBe('pending');
    expect(res.body.data.loan.principalRupees).toBe(300000);
    loanId = res.body.data.loan._id || res.body.data.loan.id;
  });

  it('400 — amount below minimum', async () => {
    const res = await request(app)
      .post('/api/v1/loans')
      .set('Authorization', `Bearer ${borrowerToken}`)
      .send({ loanType: 'personal', amountRupees: 100, tenureMonths: 12,
              purpose: 'test', employmentType: 'salaried', monthlyIncomeRupees: 50000 });
    expect(res.status).toBe(400);
  });

  it('401 — no token', async () => {
    const res = await request(app).post('/api/v1/loans').send({});
    expect(res.status).toBe(401);
  });
});

// ── List mine ─────────────────────────────────────────────────────────────
describe('GET /api/v1/loans', () => {
  it('200 — returns borrower loans', async () => {
    const res = await request(app)
      .get('/api/v1/loans')
      .set('Authorization', `Bearer ${borrowerToken}`);
    expect(res.status).toBe(200);
    expect(Array.isArray(res.body.data.loans)).toBe(true);
    expect(res.body.data.loans.length).toBeGreaterThan(0);
  });
});

// ── Admin approve + disburse ───────────────────────────────────────────────
describe('Admin loan lifecycle', () => {
  it('PATCH approve — 200', async () => {
    const res = await request(app)
      .patch(`/api/v1/loans/admin/${loanId}/approve`)
      .set('Authorization', `Bearer ${adminToken}`);
    expect(res.status).toBe(200);
    expect(res.body.data.loan.status).toBe('approved');
  });

  it('PATCH disburse — 200', async () => {
    const res = await request(app)
      .patch(`/api/v1/loans/admin/${loanId}/disburse`)
      .set('Authorization', `Bearer ${adminToken}`);
    expect(res.status).toBe(200);
    expect(res.body.data.loan.status).toBe('disbursed');
  });

  it('403 — borrower cannot approve', async () => {
    const res = await request(app)
      .patch(`/api/v1/loans/admin/${loanId}/approve`)
      .set('Authorization', `Bearer ${borrowerToken}`);
    expect(res.status).toBe(403);
  });
});

// ── EMI Payment ───────────────────────────────────────────────────────────
describe('POST /api/v1/loans/:loanId/payments/emi', () => {
  it('201 — records EMI payment', async () => {
    const res = await request(app)
      .post(`/api/v1/loans/${loanId}/payments/emi`)
      .set('Authorization', `Bearer ${borrowerToken}`)
      .send({ amountRupees: 9760, paymentMode: 'upi', referenceId: 'UPI123' });
    expect(res.status).toBe(201);
    expect(res.body.data.transaction.type).toBe('emi_payment');
    expect(res.body.data.transaction.status).toBe('success');
  });
});

// ── Statement ─────────────────────────────────────────────────────────────
describe('GET /api/v1/loans/:id/statement', () => {
  it('200 — returns loan statement with schedule', async () => {
    const res = await request(app)
      .get(`/api/v1/loans/${loanId}/statement`)
      .set('Authorization', `Bearer ${borrowerToken}`);
    expect(res.status).toBe(200);
    expect(Array.isArray(res.body.data.schedule)).toBe(true);
    expect(res.body.data.schedule.length).toBe(36);
  });
});