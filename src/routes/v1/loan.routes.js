'use strict';

const router      = require('express').Router();
const ctrl        = require('../../controllers/loan.controller');
const txnCtrl     = require('../../controllers/transaction.controller');
const { validate, validateQuery } = require('../../middlewares/validate.middleware');
const { authenticate, authorize } = require('../../middlewares/auth.middleware');
const loanSchemas = require('../../validators/loan.validator');
const txnSchemas  = require('../../validators/transaction.validator');

// All loan routes require authentication
router.use(authenticate);

// ── Borrower routes ────────────────────────────────────────────────────────
router.post(  '/',                        validate(loanSchemas.apply),         ctrl.apply);
router.get(   '/',                        validateQuery(loanSchemas.listQuery), ctrl.listMine);
router.get(   '/:id',                                                           ctrl.getOne);
router.get(   '/:id/statement',                                                 ctrl.getStatement);

// Transactions nested under loans
router.post(  '/:loanId/payments/emi',      validate(txnSchemas.recordEMI),   txnCtrl.recordEMI);
router.post(  '/:loanId/payments/prepay',   validate(txnSchemas.prepayment),  txnCtrl.prepay);
router.post(  '/:loanId/payments/foreclose',                                  txnCtrl.foreclose);
router.get(   '/:loanId/transactions',                                         txnCtrl.listByLoan);

// ── Admin routes ────────────────────────────────────────────────────────────
router.get(   '/admin/all',        authorize('admin'), validateQuery(loanSchemas.listQuery), ctrl.listAll);
router.get(   '/admin/portfolio',  authorize('admin'),                                        ctrl.portfolio);
router.patch( '/admin/:id/approve',authorize('admin'),                                        ctrl.approve);
router.patch( '/admin/:id/reject', authorize('admin'), validate(loanSchemas.reject),          ctrl.reject);
router.patch( '/admin/:id/disburse',authorize('admin'),                                       ctrl.disburse);

module.exports = router;