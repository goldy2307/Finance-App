'use strict';

const loanRepo  = require('../db/repositories/loan.repo');
const txnRepo   = require('../db/repositories/transaction.repo');
const accountRepo = require('../db/repositories/account.repo');
const { toRupees } = require('../utils/currency');
const dayjs = require('dayjs');

/**
 * All report functions return plain JS objects.
 * Controllers decide the response format (JSON / CSV export).
 */

// ── Dashboard summary for a borrower ─────────────────────────────────────
async function borrowerDashboard(userId) {
  const [account, loans, recentTxns] = await Promise.all([
    accountRepo.findByUserId(userId),
    loanRepo.findByUser(userId),
    txnRepo.findByUser(userId, { limit: 5 }),
  ]);

  const activeLoans  = loans.filter((l) => l.status === 'disbursed');
  const pendingLoans = loans.filter((l) => ['pending', 'under_review', 'approved'].includes(l.status));

  return {
    balances: {
      outstanding: toRupees(account?.outstandingPaise   ?? 0),
      overdue:     toRupees(account?.overdueAmountPaise ?? 0),
      totalRepaid: toRupees(account?.totalRepaidPaise   ?? 0),
    },
    loanCounts: {
      active:  activeLoans.length,
      pending: pendingLoans.length,
      closed:  account?.closedLoanCount ?? 0,
    },
    upcomingEMI: activeLoans.map((l) => ({
      applicationId: l.applicationId,
      loanType:      l.loanType,
      emiRupees:     toRupees(l.emiPaise),
      nextDueDate:   l.nextDueDate,
      isOverdue:     l.nextDueDate ? dayjs().isAfter(dayjs(l.nextDueDate)) : false,
    })),
    recentTransactions: (recentTxns.data || []).map((t) => ({
      txnId:       t.txnId,
      type:        t.type,
      amountRupees:toRupees(t.amountPaise),
      status:      t.status,
      processedAt: t.processedAt,
    })),
    kycStatus:   account?.kycStatus ?? 'pending',
    creditScore: account?.creditScore ?? null,
  };
}

// ── Loan statement (amortisation schedule) ────────────────────────────────
async function loanStatement(loanId) {
  const [loan, transactions] = await Promise.all([
    loanRepo.findById(loanId),
    txnRepo.findByLoan(loanId),
  ]);

  if (!loan) throw Object.assign(new Error('Loan not found.'), { statusCode: 404 });

  const schedule = buildAmortisation(
    loan.principalPaise,
    loan.interestRatePct,
    loan.tenureMonths,
    loan.startDate
  );

  return {
    loan: {
      applicationId: loan.applicationId,
      loanType:      loan.loanType,
      principalRupees: toRupees(loan.principalPaise),
      interestRatePct: loan.interestRatePct,
      tenureMonths:    loan.tenureMonths,
      emiRupees:       toRupees(loan.emiPaise),
      status:          loan.status,
      startDate:       loan.startDate,
      endDate:         loan.endDate,
    },
    schedule,
    transactions: transactions.map((t) => ({
      txnId:       t.txnId,
      type:        t.type,
      amountRupees: toRupees(t.amountPaise),
      principalRupees: toRupees(t.principalPaise || 0),
      interestRupees:  toRupees(t.interestPaise  || 0),
      status:      t.status,
      processedAt: t.processedAt,
    })),
  };
}

// ── Admin: portfolio overview ─────────────────────────────────────────────
async function portfolioSummary() {
  const [allLoans, recentTxns] = await Promise.all([
    loanRepo.findAll({}),
    txnRepo.findByUser ? null : null, // placeholder
  ]);

  const byStatus = allLoans.data.reduce((acc, l) => {
    acc[l.status] = (acc[l.status] || 0) + 1;
    return acc;
  }, {});

  const totalDisbursed = allLoans.data
    .filter((l) => ['disbursed', 'closed'].includes(l.status))
    .reduce((sum, l) => sum + (l.disbursedPaise || 0), 0);

  const totalOutstanding = allLoans.data
    .filter((l) => l.status === 'disbursed')
    .reduce((sum, l) => sum + (l.outstandingPaise || 0), 0);

  return {
    totalLoans:         allLoans.total,
    byStatus,
    totalDisbursedRupees:   toRupees(totalDisbursed),
    totalOutstandingRupees: toRupees(totalOutstanding),
  };
}

// ── Internal: build amortisation table ───────────────────────────────────
function buildAmortisation(principalPaise, annualRatePct, months, startDate) {
  const r       = annualRatePct / 12 / 100;
  const emi     = r === 0
    ? principalPaise / months
    : (principalPaise * r * Math.pow(1 + r, months)) / (Math.pow(1 + r, months) - 1);

  const rows   = [];
  let balance  = principalPaise;
  let date     = dayjs(startDate || new Date());

  for (let i = 1; i <= months; i++) {
    const interest  = Math.round(balance * r);
    const principal = Math.round(emi) - interest;
    balance         = Math.max(0, balance - principal);
    date            = date.add(1, 'month');

    rows.push({
      month:          i,
      dueDate:        date.format('YYYY-MM-DD'),
      emiRupees:      toRupees(Math.round(emi)),
      principalRupees:toRupees(principal),
      interestRupees: toRupees(interest),
      balanceRupees:  toRupees(balance),
    });
  }

  return rows;
}

module.exports = { borrowerDashboard, loanStatement, portfolioSummary };