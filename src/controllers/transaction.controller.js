'use strict';

const txnService    = require('../services/transaction.service');
const reportService = require('../services/report.service');
const accountService= require('../services/account.service');
const R             = require('../utils/response');

// POST /api/v1/loans/:loanId/payments/emi
async function recordEMI(req, res) {
  const meta = { ip: req.ip };
  const txn  = await txnService.recordEMI(req.params.loanId, req.user.id, req.body, meta);
  return R.created(res, { transaction: txn });
}

// POST /api/v1/loans/:loanId/payments/prepay
async function prepay(req, res) {
  const meta = { ip: req.ip };
  const txn  = await txnService.recordPrepayment(req.params.loanId, req.user.id, req.body, meta);
  return R.created(res, { transaction: txn });
}

// POST /api/v1/loans/:loanId/payments/foreclose
async function foreclose(req, res) {
  const meta = { ip: req.ip };
  const txn  = await txnService.forecloseLoan(req.params.loanId, req.user.id, req.body, meta);
  return R.created(res, { transaction: txn });
}

// GET /api/v1/loans/:loanId/transactions
async function listByLoan(req, res) {
  const txns = await txnService.listByLoan(req.params.loanId);
  return R.success(res, { transactions: txns });
}

// GET /api/v1/transactions  (borrower — own history)
async function listMine(req, res) {
  const { type, status, page, limit } = req.query;
  const result = await txnService.listByUser(req.user.id, {
    type, status,
    page:  Number(page)  || 1,
    limit: Number(limit) || 20,
  });
  return R.success(res, result, 200, {
    total: result.total,
    page:  result.page,
    limit: result.limit,
  });
}

// GET /api/v1/dashboard
async function dashboard(req, res) {
  const data = await reportService.borrowerDashboard(req.user.id);
  return R.success(res, data);
}

// GET /api/v1/account
async function getAccount(req, res) {
  const data = await accountService.getSummary(req.user.id);
  return R.success(res, { account: data });
}

// PATCH /api/v1/account/bank
async function updateBank(req, res) {
  const meta    = { ip: req.ip };
  const account = await accountService.updateBankDetails(req.user.id, req.body, meta);
  return R.success(res, { account });
}

module.exports = { recordEMI, prepay, foreclose, listByLoan, listMine, dashboard, getAccount, updateBank };