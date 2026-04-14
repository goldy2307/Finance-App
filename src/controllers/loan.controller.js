'use strict';

const loanService   = require('../services/loan.service');
const reportService = require('../services/report.service');
const R             = require('../utils/response');

// POST /api/v1/loans  (borrower)
async function apply(req, res) {
  const meta = { ip: req.ip, userAgent: req.headers['user-agent'] };
  const loan = await loanService.apply(req.user.id, req.body, meta);
  return R.created(res, { loan });
}

// GET /api/v1/loans  (borrower — own loans)
async function listMine(req, res) {
  const { status } = req.query;
  const loans = await loanService.listByUser(req.user.id, status ? { status } : {});
  return R.success(res, { loans });
}

// GET /api/v1/loans/:id  (borrower own | admin any)
async function getOne(req, res) {
  const loan = await loanService.getById(req.params.id, req.user.id, req.user.role);
  return R.success(res, { loan });
}

// GET /api/v1/loans/:id/statement
async function getStatement(req, res) {
  const statement = await reportService.loanStatement(req.params.id);
  return R.success(res, statement);
}

// ── Admin routes ───────────────────────────────────────────────────────────

// GET /api/v1/admin/loans  (admin)
async function listAll(req, res) {
  const { status, page, limit } = req.query;
  const result = await loanService.listAll(
    status ? { status } : {},
    { page: Number(page), limit: Number(limit) }
  );
  return R.success(res, result, 200, {
    total: result.total,
    page:  result.page,
    limit: result.limit,
  });
}

// PATCH /api/v1/admin/loans/:id/approve  (admin)
async function approve(req, res) {
  const meta = { ip: req.ip };
  const loan = await loanService.approve(req.params.id, req.user.id, meta);
  return R.success(res, { loan });
}

// PATCH /api/v1/admin/loans/:id/reject  (admin)
async function reject(req, res) {
  const meta = { ip: req.ip };
  const loan = await loanService.reject(req.params.id, req.user.id, req.body.reason, meta);
  return R.success(res, { loan });
}

// PATCH /api/v1/admin/loans/:id/disburse  (admin)
async function disburse(req, res) {
  const meta = { ip: req.ip };
  const loan = await loanService.disburse(req.params.id, req.user.id, meta);
  return R.success(res, { loan });
}

// GET /api/v1/admin/portfolio
async function portfolio(req, res) {
  const summary = await reportService.portfolioSummary();
  return R.success(res, summary);
}

module.exports = { apply, listMine, getOne, getStatement, listAll, approve, reject, disburse, portfolio };