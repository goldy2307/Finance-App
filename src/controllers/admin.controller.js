'use strict';
const loanRepo    = require('../db/repositories/loan.repo');
const userRepo    = require('../db/repositories/user.repo');
const accountRepo = require('../db/repositories/account.repo');
const txnRepo     = require('../db/repositories/transaction.repo');
const auditRepo   = require('../db/repositories/audit.repo');
const R           = require('../utils/response');

// ── Metrics ──────────────────────────────────────────────────────────────
exports.getMetrics = async (req, res) => {
  try {
    const [totalDisbursed, activeBorrowers, pendingApps, npaRate] = await Promise.all([
      loanRepo.sumDisbursed(),
      userRepo.countActive(),
      loanRepo.countByStatus('pending'),
      loanRepo.getNpaRate(),
    ]);
    return R.ok(res, { totalDisbursed, activeBorrowers, pendingApps, npaRate });
  } catch (e) { return R.serverError(res, e); }
};

// ── Applications ──────────────────────────────────────────────────────────
exports.getLoans = async (req, res) => {
  try {
    const { status, page = 1, size = 8, q = '' } = req.query;
    const result = await loanRepo.findAllAdmin({ status, page: +page, size: +size, q });
    return R.ok(res, result);
  } catch (e) { return R.serverError(res, e); }
};

exports.getLoanById = async (req, res) => {
  try {
    const loan = await loanRepo.findById(req.params.id);
    if (!loan) return R.notFound(res, 'Loan not found');
    return R.ok(res, loan);
  } catch (e) { return R.serverError(res, e); }
};

exports.approveLoan = async (req, res) => {
  try {
    const loan = await loanRepo.updateStatus(req.params.id, 'approved', req.user.id);
    return R.ok(res, loan);
  } catch (e) { return R.serverError(res, e); }
};

exports.rejectLoan = async (req, res) => {
  try {
    const loan = await loanRepo.updateStatus(req.params.id, 'rejected', req.user.id);
    return R.ok(res, loan);
  } catch (e) { return R.serverError(res, e); }
};

// ── Users ──────────────────────────────────────────────────────────────────
exports.getBorrowers = async (req, res) => {
  try {
    const { page = 1, size = 8, q = '' } = req.query;
    const result = await userRepo.findAll({ role: 'borrower', page: +page, size: +size, q });
    return R.ok(res, result);
  } catch (e) { return R.serverError(res, e); }
};

exports.getUserById = async (req, res) => {
  try {
    const [user, account] = await Promise.all([
      userRepo.findById(req.params.id),
      accountRepo.findByUserId(req.params.id),
    ]);
    if (!user) return R.notFound(res, 'User not found');
    return R.ok(res, { user, account });
  } catch (e) { return R.serverError(res, e); }
};

exports.disableUser = async (req, res) => {
  try {
    await userRepo.updateById(req.params.id, { disabled: true });
    return R.ok(res, { disabled: true });
  } catch (e) { return R.serverError(res, e); }
};

exports.flagUser = async (req, res) => {
  try {
    await accountRepo.updateByUserId(req.params.id, { flagged: true, flagReason: req.body.reason });
    return R.ok(res, { flagged: true });
  } catch (e) { return R.serverError(res, e); }
};

exports.blockUser = async (req, res) => {
  try {
    await accountRepo.updateByUserId(req.params.id, { isBlacklisted: true });
    await userRepo.updateById(req.params.id, { disabled: true });
    return R.ok(res, { blocked: true });
  } catch (e) { return R.serverError(res, e); }
};

// ── KYC ───────────────────────────────────────────────────────────────────
exports.getKycQueue = async (req, res) => {
  try {
    const accounts = await accountRepo.findByKycStatus(['pending', 'submitted'], req.query.q);
    return R.ok(res, accounts);
  } catch (e) { return R.serverError(res, e); }
};

exports.updateKycStatus = async (req, res) => {
  try {
    const { status } = req.body;
    const updated = await accountRepo.updateByUserId(req.params.id, { kycStatus: status });
    return R.ok(res, updated);
  } catch (e) { return R.serverError(res, e); }
};

// ── Audit ──────────────────────────────────────────────────────────────────
exports.getAuditLogs = async (req, res) => {
  try {
    const { q, role, action, from, to, page = 1, size = 8 } = req.query;
    const result = await auditRepo.find({ q, role, action, from, to, page: +page, size: +size });
    return R.ok(res, result);
  } catch (e) { return R.serverError(res, e); }
};

// ── Settings ────────────────────────────────────────────────────────────────
exports.getSettings = async (req, res) => {
  try {
    const settings = await require('../db/repositories/settings.repo').get();
    return R.ok(res, settings);
  } catch (e) { return R.serverError(res, e); }
};

exports.saveSettings = async (req, res) => {
  try {
    const updated = await require('../db/repositories/settings.repo').upsert(req.body);
    return R.ok(res, updated);
  } catch (e) { return R.serverError(res, e); }
};

// ── Search ──────────────────────────────────────────────────────────────────
exports.search = async (req, res) => {
  try {
    const q = req.query.q || '';
    if (q.length < 2) return R.ok(res, { items: [] });
    const [users, loans] = await Promise.all([
      userRepo.search(q, 5),
      loanRepo.search(q, 5),
    ]);
    const items = [
      ...users.map(u => ({ id: u._id || u.id, name: u.firstName + ' ' + u.lastName, type: 'user' })),
      ...loans.map(l => ({ id: l._id || l.id, name: l.id, type: 'loan' })),
    ];
    return R.ok(res, { items });
  } catch (e) { return R.serverError(res, e); }
};

// Stub remaining — implement similarly
['getDisbursalTrend','getLoanMix','getActivity','getDisbursals','getRepayments',
 'getCollections','getFraudList','getReports','getAdmins','addAdmin','disableAdmin',
 'getRoles','addRole','updateRole','getBanks','addBank','sendNotification',
 'getNotifTemplates','getScheduledNotifs','getNotifHistory','cancelScheduled',
 'disburseLoan','updateUser','resetPassword','unflagUser','adjustRisk',
].forEach(name => {
  if (!exports[name]) exports[name] = async (req, res) => R.ok(res, []);
});