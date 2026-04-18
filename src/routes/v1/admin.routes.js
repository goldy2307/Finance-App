'use strict';
const router = require('express').Router();
const ctrl   = require('../../controllers/admin.controller');
const { authenticate, authorize } = require('../../middlewares/auth.middleware');

router.use(authenticate, authorize('admin'));

// Dashboard
router.get('/metrics',          ctrl.getMetrics);
router.get('/disbursal-trend',  ctrl.getDisbursalTrend);  // ?range=6m|1y
router.get('/loan-mix',         ctrl.getLoanMix);
router.get('/activity',         ctrl.getActivity);

// Applications (loans)
router.get('/loans',            ctrl.getLoans);           // ?status=&page=&size=&q=
router.get('/loans/:id',        ctrl.getLoanById);
router.patch('/loans/:id/approve', ctrl.approveLoan);
router.patch('/loans/:id/reject',  ctrl.rejectLoan);
router.patch('/loans/:id/disburse',ctrl.disburseLoan);

// Borrowers / Users
router.get('/borrowers',        ctrl.getBorrowers);       // ?page=&size=&q=
router.get('/users/:id',        ctrl.getUserById);
router.patch('/users/:id',      ctrl.updateUser);
router.post('/users/:id/reset-password', ctrl.resetPassword);
router.patch('/users/:id/disable',  ctrl.disableUser);
router.patch('/users/:id/flag',     ctrl.flagUser);
router.patch('/users/:id/unflag',   ctrl.unflagUser);
router.patch('/users/:id/block',    ctrl.blockUser);
router.patch('/users/:id/risk',     ctrl.adjustRisk);

// Disbursals
router.get('/disbursals',       ctrl.getDisbursals);      // ?page=&size=&q=

// Repayments
router.get('/repayments',       ctrl.getRepayments);      // ?page=&size=&q=

// KYC
router.get('/kyc',              ctrl.getKycQueue);        // ?q=
router.patch('/kyc/:id',        ctrl.updateKycStatus);    // body: { status }

// Collections
router.get('/collections',      ctrl.getCollections);     // ?q=

// Fraud & Risk
router.get('/fraud',            ctrl.getFraudList);       // ?filter=all|flagged|blocked|high_risk&q=

// Audit
router.get('/audit',            ctrl.getAuditLogs);       // ?q=&role=&action=&from=&to=&page=&size=

// Reports
router.get('/reports',          ctrl.getReports);

// Admin management
router.get('/admins',           ctrl.getAdmins);
router.post('/admins',          ctrl.addAdmin);
router.patch('/admins/:id/disable', ctrl.disableAdmin);
router.get('/roles',            ctrl.getRoles);
router.post('/roles',           ctrl.addRole);
router.patch('/roles/:id',      ctrl.updateRole);
router.get('/banks',            ctrl.getBanks);
router.post('/banks',           ctrl.addBank);

// Notifications
router.post('/notifications',               ctrl.sendNotification);
router.get('/notifications/templates',      ctrl.getNotifTemplates);
router.get('/notifications/scheduled',      ctrl.getScheduledNotifs);
router.get('/notifications/history',        ctrl.getNotifHistory);
router.patch('/notifications/scheduled/:id/cancel', ctrl.cancelScheduled);

// Settings
router.get('/settings',         ctrl.getSettings);
router.patch('/settings',       ctrl.saveSettings);

// Global search
router.get('/search',           ctrl.search);            // ?q=

module.exports = router;