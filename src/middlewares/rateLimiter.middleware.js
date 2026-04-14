'use strict';

const rateLimit = require('express-rate-limit');
const config    = require('../config');
const R         = require('../utils/response');

/** General rate limiter — applied to all routes */
const generalLimiter = rateLimit({
  windowMs: config.rateLimit.windowMs,
  max:      config.rateLimit.max,
  standardHeaders: true,
  legacyHeaders:   false,
  handler: (req, res) => {
    R.error(res, 'Too many requests. Please slow down.', 429, 'RATE_LIMITED');
  },
});

/** Strict limiter for auth endpoints (prevent brute-force) */
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 min
  max:      10,
  standardHeaders: true,
  legacyHeaders:   false,
  handler: (req, res) => {
    R.error(res, 'Too many auth attempts. Try again in 15 minutes.', 429, 'RATE_LIMITED');
  },
});

module.exports = { generalLimiter, authLimiter };