'use strict';

const logger = require('../utils/logger');
const R      = require('../utils/response');

/**
 * Global error handler — must be registered LAST in Express.
 * Catches all errors thrown or passed via next(err).
 */
// eslint-disable-next-line no-unused-vars
function errorHandler(err, req, res, next) {
  // Log internal details (never expose stack in prod)
  logger.error({
    message:    err.message,
    stack:      err.stack,
    path:       req.path,
    method:     req.method,
    userId:     req.user?.id ?? 'anonymous',
  });

  // Known application errors (thrown with statusCode)
  if (err.statusCode) {
    return R.error(res, err.message, err.statusCode, err.code || 'APP_ERROR');
  }

  // Mongoose validation error
  if (err.name === 'ValidationError') {
    const details = Object.values(err.errors).map((e) => ({
      field:   e.path,
      message: e.message,
    }));
    return R.badRequest(res, 'Validation failed.', details);
  }

  // Mongoose duplicate key
  if (err.code === 11000) {
    const field = Object.keys(err.keyPattern || {})[0] || 'field';
    return R.conflict(res, `${field} already exists.`);
  }

  // Sequelize unique constraint
  if (err.name === 'SequelizeUniqueConstraintError') {
    const field = err.errors?.[0]?.path || 'field';
    return R.conflict(res, `${field} already exists.`);
  }

  // Sequelize validation
  if (err.name === 'SequelizeValidationError') {
    const details = err.errors.map((e) => ({ field: e.path, message: e.message }));
    return R.badRequest(res, 'Validation failed.', details);
  }

  // JWT errors (should be caught in auth middleware, but just in case)
  if (err.name === 'JsonWebTokenError' || err.name === 'TokenExpiredError') {
    return R.unauthorized(res, 'Invalid or expired token.');
  }

  // Fallback — 500
  return R.error(res, 'An unexpected error occurred. Please try again.', 500);
}

/** 404 handler — register before errorHandler */
function notFoundHandler(req, res) {
  R.notFound(res, `Route ${req.method} ${req.path} not found.`);
}

module.exports = { errorHandler, notFoundHandler };