'use strict';

const authService = require('../services/auth.service');
const R           = require('../utils/response');

/**
 * authenticate — verifies JWT in Authorization header.
 * Attaches req.user = { id, role } on success.
 */
async function authenticate(req, res, next) {
  try {
    const header = req.headers.authorization || '';
    if (!header.startsWith('Bearer ')) {
      return R.unauthorized(res, 'Missing or malformed Authorization header.');
    }

    const token   = header.slice(7);
    const payload = authService.verifyAccess(token);

    req.user = { id: payload.sub, role: payload.role };
    next();
  } catch (err) {
    if (err.name === 'TokenExpiredError') return R.unauthorized(res, 'Token expired.');
    return R.unauthorized(res, 'Invalid token.');
  }
}

/**
 * authorize(...roles) — role-based gate after authenticate.
 * Usage: router.get('/admin', authenticate, authorize('admin'), handler)
 */
function authorize(...roles) {
  return (req, res, next) => {
    if (!req.user) return R.unauthorized(res);
    if (!roles.includes(req.user.role)) {
      return R.forbidden(res, `Requires role: ${roles.join(' | ')}`);
    }
    next();
  };
}

module.exports = { authenticate, authorize };