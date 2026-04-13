'use strict';

const { v4: uuidv4 }   = require('uuid');
const loanRepo          = require('../db/repositories/loan.repo');
const transactionRepo   = require('../db/repositories/transaction.repo');
const { calcEMI }       = require('../utils/currency');
const { addMonths }     = require('../utils/date');
const auditLogger       = require('./audit.logger');
const logger            = require('../utils/logger');

/** Generate a human-readable application ID like CLY-A7X3K1 */
function generateAppId() {
  return 'CLY-' + uuidv4().replace(/-/g, '').toUpperCase().slice(0, 6);
}

class LoanService {

  /** Submit a new loan application */
  async apply({ userId, type, principal, interestRate, tenureMonths, purpose }) {
    const emi           = calcEMI(principal, interestRate, tenureMonths);
    const applicationId = generateAppId();

    const loan = await loanRepo.create({
      userId,
      applicationId,
      type,
      principal,
      interestRate,
      tenureMonths,
      emi,
      purpose,
      status:              'pending',
      outstandingPrincipal: principal,
      totalEmis:            tenureMonths,
    });

    await auditLogger.log({
      action:   'LOAN_APPLICATION_SUBMITTED',
      userId,
      entityId: loan._id,
      meta:     { applicationId, type, principal },
    });

    logger.info(`[Loan] Application submitted: ${applicationId}`);
    return loan;
  }

  /** Get loans for a specific user */
  async getByUser(userId, filters) {
    return loanRepo.findByUserId(userId, filters);
  }

  /** Get single loan — checks ownership */
  async getById(loanId, requestingUserId, requestingRole) {
    const loan = await loanRepo.findById(loanId);
    if (!loan) throw Object.assign(new Error('Loan not found'), { status: 404 });

    const isOwner = loan.userId.toString() === requestingUserId.toString();
    const isAdmin = ['admin', 'auditor'].includes(requestingRole);
    if (!isOwner && !isAdmin) throw Object.assign(new Error('Forbidden'), { status: 403 });

    return loan;
  }

  /** Admin: approve a loan */
  async approve(loanId, adminUserId) {
    const loan = await loanRepo.findById(loanId);
    if (!loan) throw Object.assign(new Error('Loan not found'), { status: 404 });
    if (loan.status !== 'pending' && loan.status !== 'under_review') {
      throw Object.assign(new Error(`Cannot approve loan in status: ${loan.status}`), { status: 400 });
    }

    const nextEmiDue = addMonths(new Date(), 1);
    const updated    = await loanRepo.updateStatus(loanId, 'approved', {
      approvedBy: adminUserId,
      approvedAt: new Date(),
      nextEmiDue,
    });

    await auditLogger.log({
      action:   'LOAN_APPROVED',
      userId:   adminUserId,
      entityId: loanId,
      meta:     { loanId },
    });

    return updated;
  }

  /** Admin: reject a loan */
  async reject(loanId, adminUserId, reason) {
    const loan = await loanRepo.findById(loanId);
    if (!loan) throw Object.assign(new Error('Loan not found'), { status: 404 });

    const updated = await loanRepo.updateStatus(loanId, 'rejected', {
      rejectionNote: reason,
    });

    await auditLogger.log({
      action:   'LOAN_REJECTED',
      userId:   adminUserId,
      entityId: loanId,
      meta:     { reason },
    });

    return updated;
  }

  /** Disburse an approved loan — creates disbursement transaction */
  async disburse(loanId, adminUserId, bankAccountMasked) {
    const loan = await loanRepo.findById(loanId);
    if (!loan) throw Object.assign(new Error('Loan not found'), { status: 404 });
    if (loan.status !== 'approved') {
      throw Object.assign(new Error('Loan must be approved before disbursement'), { status: 400 });
    }

    // Create disbursement transaction
    await transactionRepo.create({
      transactionId: uuidv4(),
      userId:        loan.userId,
      loanId:        loan._id,
      type:          'disbursement',
      amount:        loan.principal,
      status:        'completed',
      debitAccount:  'CASHLY_FLOAT',
      creditAccount: bankAccountMasked,
      notes:         `Loan disbursement for ${loan.applicationId}`,
    });

    const updated = await loanRepo.updateStatus(loanId, 'active', {
      disbursedAt: new Date(),
      disbursedTo: bankAccountMasked,
    });

    await auditLogger.log({
      action:   'LOAN_DISBURSED',
      userId:   adminUserId,
      entityId: loanId,
      meta:     { amount: loan.principal },
    });

    return updated;
  }

  /** Admin: list all loans */
  async listAll(filters) {
    return loanRepo.findAll(filters);
  }
}

module.exports = new LoanService();