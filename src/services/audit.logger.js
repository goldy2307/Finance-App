'use strict';

/**
 * Audit Logger — append-only event trail.
 * Every financial action writes here. Records are NEVER updated or deleted.
 *
 * For now uses Winston to write to a dedicated audit log file.
 * In production replace with: append-only DB collection / S3 / SIEM.
 */

const { createLogger, format, transports } = require('winston');
const DailyRotateFile = require('winston-daily-rotate-file');
const path  = require('path');
const config = require('../config');

const auditLogger = createLogger({
  level:  'info',
  format: format.combine(format.timestamp(), format.json()),
  transports: [
    new DailyRotateFile({
      dirname:       path.resolve(config.log.dir, 'audit'),
      filename:      'audit-%DATE%.log',
      datePattern:   'YYYY-MM-DD',
      zippedArchive: true,
      maxFiles:      '365d',  // keep 1 year
    }),
  ],
});

/**
 * Log an auditable event.
 *
 * @param {object} opts
 * @param {string}  opts.action       - e.g. 'LOAN_APPROVED', 'EMI_PAID'
 * @param {string}  opts.actorId      - userId who triggered it
 * @param {string}  opts.actorRole    - 'borrower' | 'admin' | 'agent' | 'system'
 * @param {string}  [opts.resourceId] - loanId, txnId, etc.
 * @param {string}  [opts.resourceType] - 'loan', 'transaction', 'user'
 * @param {object}  [opts.before]     - state snapshot before change
 * @param {object}  [opts.after]      - state snapshot after change
 * @param {string}  [opts.ip]         - request IP
 * @param {string}  [opts.userAgent]
 */
function log(opts) {
  auditLogger.info({
    ...opts,
    env:    config.env,
    ts:     new Date().toISOString(),
  });
}

// ── Convenience wrappers ──────────────────────────────────────────────────
const ACTIONS = {
  USER_REGISTERED:    'USER_REGISTERED',
  USER_LOGIN:         'USER_LOGIN',
  USER_LOGOUT:        'USER_LOGOUT',
  PASSWORD_CHANGED:   'PASSWORD_CHANGED',
  LOAN_APPLIED:       'LOAN_APPLIED',
  LOAN_APPROVED:      'LOAN_APPROVED',
  LOAN_REJECTED:      'LOAN_REJECTED',
  LOAN_DISBURSED:     'LOAN_DISBURSED',
  EMI_PAID:           'EMI_PAID',
  PREPAYMENT:         'PREPAYMENT',
  LOAN_FORECLOSED:    'LOAN_FORECLOSED',
  LOAN_CLOSED:        'LOAN_CLOSED',
  DOCUMENT_UPLOADED:  'DOCUMENT_UPLOADED',
  DOCUMENT_VERIFIED:  'DOCUMENT_VERIFIED',
  KYC_UPDATED:        'KYC_UPDATED',
  ACCOUNT_UPDATED:    'ACCOUNT_UPDATED',
};

module.exports = { log, ACTIONS };