'use strict';

const txnRepo     = require('../db/repositories/transaction.repo');
const loanRepo    = require('../db/repositories/loan.repo');
const accountRepo = require('../db/repositories/account.repo');
const audit       = require('./audit.logger');
const { toPaise, toRupees, calcEMI } = require('../utils/currency');
const { now, addMonths, isPastDue }  = require('../utils/date');

// ── Record an EMI payment ────────────────────────────────────────────────
async function recordEMI(loanId, userId, data, meta = {}) {
  const loan = await loanRepo.findById(loanId);
  if (!loan) throw Object.assign(new Error('Loan not found.'), { statusCode: 404 });
  if (loan.status !== 'disbursed') {
    throw Object.assign(new Error('EMI payments are only valid for active (disbursed) loans.'), { statusCode: 400 });
  }

  const {
    amountRupees,
    paymentMode = 'upi',
    referenceId,
  } = data;

  const amountPaise = toPaise(amountRupees);
  const r           = loan.interestRatePct / 12 / 100;

  // Split payment into principal + interest
  const interestPaise  = Math.round(loan.outstandingPaise * r);
  const principalPaise = Math.max(0, amountPaise - interestPaise);

  const txn = await txnRepo.create({
    loanId,
    userId,
    type:           'emi_payment',
    amountPaise,
    principalPaise,
    interestPaise,
    paymentMode,
    referenceId,
    status:         'success',
    processedAt:    now(),
    dueDate:        loan.nextDueDate,
    description:    `EMI payment — ${loan.applicationId}`,
  });

  const newOutstanding = Math.max(0, loan.outstandingPaise - principalPaise);
  const nextDue        = addMonths(loan.nextDueDate || now(), 1);
  const isClosed       = newOutstanding <= 0;

  // Update loan
  await loanRepo.updateById(loanId, {
    outstandingPaise: newOutstanding,
    nextDueDate:      isClosed ? null : nextDue,
    status:           isClosed ? 'closed' : 'disbursed',
  });

  // Update account
  await accountRepo.incrementFields(userId, {
    totalRepaidPaise: amountPaise,
    outstandingPaise: -principalPaise,
    ...(isClosed ? { activeLoanCount: -1, closedLoanCount: 1 } : {}),
  });

  audit.log({
    action:       audit.ACTIONS.EMI_PAID,
    actorId:      userId,
    actorRole:    'borrower',
    resourceId:   txn.txnId,
    resourceType: 'transaction',
    after:        { amountRupees, outstandingRupees: toRupees(newOutstanding) },
    ...meta,
  });

  return formatTxn(txn);
}

// ── Prepayment ────────────────────────────────────────────────────────────
async function recordPrepayment(loanId, userId, data, meta = {}) {
  const loan = await loanRepo.findById(loanId);
  if (!loan) throw Object.assign(new Error('Loan not found.'), { statusCode: 404 });
  if (loan.status !== 'disbursed') {
    throw Object.assign(new Error('Loan is not active.'), { statusCode: 400 });
  }

  const amountPaise = toPaise(data.amountRupees);
  if (amountPaise >= loan.outstandingPaise) {
    // Full foreclosure
    return forecloseLoan(loanId, userId, data, meta);
  }

  const txn = await txnRepo.create({
    loanId, userId,
    type:        'prepayment',
    amountPaise,
    principalPaise: amountPaise,
    status:      'success',
    paymentMode: data.paymentMode || 'upi',
    referenceId: data.referenceId,
    processedAt: now(),
    description: `Prepayment — ${loan.applicationId}`,
  });

  const newOutstanding = loan.outstandingPaise - amountPaise;
  // Recalculate EMI for remaining balance + tenure
  const remaining = Math.max(1, loan.tenureMonths - /* months elapsed */ 1);
  const newEMI    = calcEMI(newOutstanding, loan.interestRatePct, remaining);

  await loanRepo.updateById(loanId, { outstandingPaise: newOutstanding, emiPaise: newEMI });
  await accountRepo.incrementFields(userId, {
    totalRepaidPaise: amountPaise,
    outstandingPaise: -amountPaise,
  });

  audit.log({
    action:       audit.ACTIONS.PREPAYMENT,
    actorId:      userId, actorRole: 'borrower',
    resourceId:   txn.txnId, resourceType: 'transaction',
    after:        { amountRupees: data.amountRupees, newOutstanding: toRupees(newOutstanding) },
    ...meta,
  });

  return formatTxn(txn);
}

// ── Foreclosure ───────────────────────────────────────────────────────────
async function forecloseLoan(loanId, userId, data, meta = {}) {
  const loan = await loanRepo.findById(loanId);
  if (!loan) throw Object.assign(new Error('Loan not found.'), { statusCode: 404 });

  const amountPaise = loan.outstandingPaise;

  const txn = await txnRepo.create({
    loanId, userId,
    type:           'foreclosure',
    amountPaise,
    principalPaise: amountPaise,
    status:         'success',
    paymentMode:    data.paymentMode || 'upi',
    processedAt:    now(),
    description:    `Foreclosure — ${loan.applicationId}`,
  });

  await loanRepo.updateStatus(loanId, 'closed', { outstandingPaise: 0, nextDueDate: null });
  await accountRepo.incrementFields(userId, {
    totalRepaidPaise: amountPaise,
    outstandingPaise: -amountPaise,
    activeLoanCount:  -1,
    closedLoanCount:   1,
  });

  audit.log({
    action:       audit.ACTIONS.LOAN_FORECLOSED,
    actorId:      userId, actorRole: 'borrower',
    resourceId:   loan.applicationId, resourceType: 'loan',
    after:        { amountPaise },
    ...meta,
  });

  return formatTxn(txn);
}

// ── Get transaction history for a user ───────────────────────────────────
async function listByUser(userId, opts = {}) {
  const result = await txnRepo.findByUser(userId, opts);
  return { ...result, data: result.data.map(formatTxn) };
}

// ── Get transactions for a loan ───────────────────────────────────────────
async function listByLoan(loanId) {
  const txns = await txnRepo.findByLoan(loanId);
  return txns.map(formatTxn);
}

// ── Format helper ─────────────────────────────────────────────────────────
function formatTxn(txn) {
  if (!txn) return null;
  return {
    ...txn,
    amountRupees:    toRupees(txn.amountPaise),
    principalRupees: toRupees(txn.principalPaise || 0),
    interestRupees:  toRupees(txn.interestPaise  || 0),
    penaltyRupees:   toRupees(txn.penaltyPaise   || 0),
  };
}

module.exports = { recordEMI, recordPrepayment, forecloseLoan, listByUser, listByLoan };