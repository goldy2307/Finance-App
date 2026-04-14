'use strict';

const loanRepo    = require('../db/repositories/loan.repo');
const accountRepo = require('../db/repositories/account.repo');
const txnRepo     = require('../db/repositories/transaction.repo');
const audit       = require('./audit.logger');
const { toPaise, toRupees, calcEMI } = require('../utils/currency');
const { now, addMonths }             = require('../utils/date');
const logger = require('../utils/logger');

// ── Interest rate map ─────────────────────────────────────────────────────
const BASE_RATES = {
  personal:  10.5,
  business:  12.0,
  home:       8.75,
  education:  9.25,
};

// ── Apply for a loan ──────────────────────────────────────────────────────
async function apply(userId, data, meta = {}) {
  const {
    loanType,
    amountRupees,
    tenureMonths,
    purpose,
    employmentType,
    monthlyIncomeRupees,
  } = data;

  // Check for active loan of same type (business rule)
  const existing = await loanRepo.findByUser(userId, { loanType, status: 'disbursed' });
  if (existing.length > 0) {
    throw Object.assign(
      new Error(`You already have an active ${loanType} loan.`),
      { statusCode: 409 }
    );
  }

  const interestRatePct  = BASE_RATES[loanType];
  const principalPaise   = toPaise(amountRupees);
  const emiPaise         = calcEMI(principalPaise, interestRatePct, tenureMonths);

  const loan = await loanRepo.create({
    userId,
    loanType,
    principalPaise,
    outstandingPaise: principalPaise,
    interestRatePct,
    tenureMonths,
    emiPaise,
    purpose,
    employmentType,
    monthlyIncomePaise: toPaise(monthlyIncomeRupees || 0),
    status: 'pending',
  });

  audit.log({
    action:       audit.ACTIONS.LOAN_APPLIED,
    actorId:      userId,
    actorRole:    'borrower',
    resourceId:   loan.applicationId,
    resourceType: 'loan',
    after:        { loanType, amountRupees, tenureMonths },
    ...meta,
  });

  return formatLoan(loan);
}

// ── Get a single loan ─────────────────────────────────────────────────────
async function getById(loanId, requestingUserId, requestingRole) {
  const loan = await loanRepo.findById(loanId);
  if (!loan) throw Object.assign(new Error('Loan not found.'), { statusCode: 404 });

  // Borrowers can only see their own loans
  const ownerId = String(loan.userId._id || loan.userId);
  if (requestingRole === 'borrower' && ownerId !== requestingUserId) {
    throw Object.assign(new Error('Forbidden.'), { statusCode: 403 });
  }

  return formatLoan(loan);
}

// ── List loans for a user ─────────────────────────────────────────────────
async function listByUser(userId, filters = {}) {
  const loans = await loanRepo.findByUser(userId, filters);
  return loans.map(formatLoan);
}

// ── Admin: list all loans with pagination ────────────────────────────────
async function listAll(filters = {}, pagination = {}) {
  const result = await loanRepo.findAll(filters, pagination);
  return { ...result, data: result.data.map(formatLoan) };
}

// ── Admin: approve loan ───────────────────────────────────────────────────
async function approve(loanId, adminId, meta = {}) {
  const loan = await loanRepo.findById(loanId);
  if (!loan) throw Object.assign(new Error('Loan not found.'), { statusCode: 404 });
  if (loan.status !== 'pending' && loan.status !== 'under_review') {
    throw Object.assign(new Error(`Cannot approve a loan with status: ${loan.status}`), { statusCode: 400 });
  }

  const updated = await loanRepo.updateStatus(loanId, 'approved');

  audit.log({
    action:       audit.ACTIONS.LOAN_APPROVED,
    actorId:      adminId,
    actorRole:    'admin',
    resourceId:   loan.applicationId,
    resourceType: 'loan',
    before:       { status: loan.status },
    after:        { status: 'approved' },
    ...meta,
  });

  return formatLoan(updated);
}

// ── Admin: reject loan ────────────────────────────────────────────────────
async function reject(loanId, adminId, reason, meta = {}) {
  const loan = await loanRepo.findById(loanId);
  if (!loan) throw Object.assign(new Error('Loan not found.'), { statusCode: 404 });

  const updated = await loanRepo.updateStatus(loanId, 'rejected', { rejectionReason: reason });

  audit.log({
    action:       audit.ACTIONS.LOAN_REJECTED,
    actorId:      adminId,
    actorRole:    'admin',
    resourceId:   loan.applicationId,
    resourceType: 'loan',
    before:       { status: loan.status },
    after:        { status: 'rejected', reason },
    ...meta,
  });

  return formatLoan(updated);
}

// ── Admin: disburse loan ──────────────────────────────────────────────────
async function disburse(loanId, adminId, meta = {}) {
  const loan = await loanRepo.findById(loanId);
  if (!loan) throw Object.assign(new Error('Loan not found.'), { statusCode: 404 });
  if (loan.status !== 'approved') {
    throw Object.assign(new Error('Only approved loans can be disbursed.'), { statusCode: 400 });
  }

  const startDate   = now();
  const endDate     = addMonths(startDate, loan.tenureMonths);
  const nextDueDate = addMonths(startDate, 1);
  const userId      = String(loan.userId._id || loan.userId);

  // Update loan to disbursed
  const updated = await loanRepo.updateStatus(loanId, 'disbursed', {
    disbursedPaise: loan.principalPaise,
    startDate,
    endDate,
    nextDueDate,
  });

  // Record disbursement transaction
  await txnRepo.create({
    loanId:      loanId,
    userId,
    type:        'disbursement',
    amountPaise: loan.principalPaise,
    status:      'success',
    paymentMode: 'internal',
    processedAt: now(),
    description: `Loan disbursed — ${loan.applicationId}`,
  });

  // Update account balances
  await accountRepo.incrementFields(userId, {
    totalLoanedPaise: loan.principalPaise,
    outstandingPaise: loan.principalPaise,
    activeLoanCount:  1,
  });

  audit.log({
    action:       audit.ACTIONS.LOAN_DISBURSED,
    actorId:      adminId,
    actorRole:    'admin',
    resourceId:   loan.applicationId,
    resourceType: 'loan',
    before:       { status: loan.status },
    after:        { status: 'disbursed', disbursedPaise: loan.principalPaise },
    ...meta,
  });

  return formatLoan(updated);
}

// ── Format helper: paise → rupees for API response ────────────────────────
function formatLoan(loan) {
  if (!loan) return null;
  return {
    ...loan,
    principalRupees:  toRupees(loan.principalPaise),
    disbursedRupees:  toRupees(loan.disbursedPaise  || 0),
    outstandingRupees:toRupees(loan.outstandingPaise || 0),
    emiRupees:        toRupees(loan.emiPaise         || 0),
  };
}

module.exports = { apply, getById, listByUser, listAll, approve, reject, disburse };