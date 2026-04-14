'use strict';

const router     = require('express').Router();
const ctrl       = require('../../controllers/transaction.controller');
const { validateQuery }   = require('../../middlewares/validate.middleware');
const { authenticate }    = require('../../middlewares/auth.middleware');
const txnSchemas = require('../../validators/transaction.validator');

router.use(authenticate);

// GET /api/v1/transactions           — paginated history for logged-in user
router.get('/', validateQuery(txnSchemas.listQuery), ctrl.listMine);

// GET /api/v1/dashboard              — borrower dashboard summary
router.get('/dashboard', ctrl.dashboard);

// GET /api/v1/account                — account balances + KYC
router.get('/account', ctrl.getAccount);

// PATCH /api/v1/account/bank         — update bank / NACH details
router.patch('/account/bank', ctrl.updateBank);

module.exports = router;