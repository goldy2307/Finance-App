'use strict';

const accountRepo = require('../db/repositories/account.repo');
const userRepo    = require('../db/repositories/user.repo');
const audit       = require('./audit.logger');
const { toRupees }= require('../utils/currency');

// ── Get account summary ───────────────────────────────────────────────────
async function getSummary(userId) {
  const [account, user] = await Promise.all([
    accountRepo.findByUserId(userId),
    userRepo.findById(userId),
  ]);

  if (!account) throw Object.assign(new Error('Account not found.'), { statusCode: 404 });

  // Convert paise → rupees for API consumers
  return {
    userId,
    user: { firstName: user.firstName, lastName: user.lastName, email: user.email },
    balances: {
      totalLoaned:    toRupees(account.totalLoanedPaise),
      totalRepaid:    toRupees(account.totalRepaidPaise),
      outstanding:    toRupees(account.outstandingPaise),
      overdue:        toRupees(account.overdueAmountPaise),
    },
    loans: {
      active: account.activeLoanCount,
      closed: account.closedLoanCount,
    },
    creditScore:     account.creditScore ?? null,
    kycStatus:       account.kycStatus,
    nachActive:      account.nachMandateActive,
    isBlacklisted:   account.isBlacklisted,
  };
}

// ── Update bank details ───────────────────────────────────────────────────
async function updateBankDetails(userId, bankData, meta = {}) {
  const account = await accountRepo.findByUserId(userId);
  if (!account) throw Object.assign(new Error('Account not found.'), { statusCode: 404 });

  const before = account.bankAccount || {};
  const updated = await accountRepo.updateByUserId(userId, {
    bankAccount: { ...bankData, verified: false }, // re-verify on change
  });

  audit.log({
    action:       audit.ACTIONS.ACCOUNT_UPDATED,
    actorId:      userId,
    actorRole:    'borrower',
    resourceId:   String(account._id || account.id),
    resourceType: 'account',
    before:       { bankAccount: before },
    after:        { bankAccount: bankData },
    ...meta,
  });

  return updated;
}

// ── Update KYC status (admin) ─────────────────────────────────────────────
async function updateKYCStatus(userId, status, actorId, meta = {}) {
  const validStatuses = ['pending', 'submitted', 'verified', 'rejected'];
  if (!validStatuses.includes(status)) {
    throw Object.assign(new Error(`Invalid KYC status: ${status}`), { statusCode: 400 });
  }

  const before  = await accountRepo.findByUserId(userId);
  const updated = await accountRepo.updateByUserId(userId, { kycStatus: status });

  audit.log({
    action:       audit.ACTIONS.KYC_UPDATED,
    actorId,
    actorRole:    'admin',
    resourceId:   userId,
    resourceType: 'account',
    before:       { kycStatus: before?.kycStatus },
    after:        { kycStatus: status },
    ...meta,
  });

  return updated;
}

module.exports = { getSummary, updateBankDetails, updateKYCStatus };