'use strict';

const router = require('express').Router();

// ── Health check (public, no auth) ────────────────────────────────────────
router.get('/health', (req, res) => {
  res.json({
    status:    'ok',
    service:   'cashly-api',
    version:   'v1',
    timestamp: new Date().toISOString(),
    uptime:    `${Math.floor(process.uptime())}s`,
  });
});

// ── Feature routers ───────────────────────────────────────────────────────
router.use('/auth',         require('./auth.routes'));
router.use('/loans',        require('./loan.routes'));
router.use('/transactions', require('./transaction.routes'));

// Re-export dashboard + account from transaction router at top level
// (already mounted via transaction.routes, nothing extra needed)

module.exports = router;
