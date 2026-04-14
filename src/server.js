'use strict';

// Load async errors so every async route handler is wrapped automatically
require('express-async-errors');

const express    = require('express');
const cors       = require('cors');
const helmet     = require('helmet');
const morgan     = require('morgan');
const compression= require('compression');
const path       = require('path');

const config     = require('./config');
const { connectDB } = require('./config/db.config');
const logger     = require('./utils/logger');

const v1Router   = require('./routes/v1');
const { generalLimiter }   = require('./middlewares/rateLimiter.middleware');
const { errorHandler, notFoundHandler } = require('./middlewares/errorHandler.middleware');

// ── Create app ────────────────────────────────────────────────────────────
const app = express();

// ── Security headers ──────────────────────────────────────────────────────
app.use(helmet({
  crossOriginResourcePolicy: { policy: 'cross-origin' },
}));

// ── CORS ──────────────────────────────────────────────────────────────────
app.use(cors({
  origin: (origin, cb) => {
    // Allow server-to-server calls (no origin) and whitelisted origins
    if (!origin || config.cors.origins.includes(origin)) return cb(null, true);
    cb(new Error(`Origin ${origin} not allowed by CORS`));
  },
  credentials: true,
  methods:     ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
}));

// ── Compression ───────────────────────────────────────────────────────────
app.use(compression());

// ── HTTP logging ──────────────────────────────────────────────────────────
if (config.isDev) {
  app.use(morgan('dev'));
} else {
  app.use(morgan('combined', {
    stream: { write: (msg) => logger.http(msg.trim()) },
    skip:   (req) => req.url === '/api/v1/health',
  }));
}

// ── Body parsers ──────────────────────────────────────────────────────────
app.use(express.json({ limit: '1mb' }));
app.use(express.urlencoded({ extended: true, limit: '1mb' }));

// ── Trust proxy (for correct IP behind nginx / AWS ALB) ───────────────────
app.set('trust proxy', 1);

// ── Global rate limiter ───────────────────────────────────────────────────
app.use(generalLimiter);

// ── Static files (frontend build) ────────────────────────────────────────
app.use(express.static(path.join(__dirname, '..', 'public')));

// ── API routes ────────────────────────────────────────────────────────────
app.use('/api/v1', v1Router);

// ── SPA fallback: serve index.html for all non-API GET requests ───────────
app.get(/^(?!\/api).*$/, (req, res) => {
  res.sendFile(path.join(__dirname, '..', 'public', 'index.html'));
});

// ── 404 handler (API routes that matched no route) ────────────────────────
app.use(notFoundHandler);

// ── Global error handler — must be last ──────────────────────────────────
app.use(errorHandler);

// ── Boot ──────────────────────────────────────────────────────────────────
async function boot() {
  try {
    await connectDB();

    const server = app.listen(config.port, () => {
      logger.info(`Cashly API  ▶  http://localhost:${config.port}`);
      logger.info(`Environment : ${config.env}`);
      logger.info(`DB driver   : ${config.db.driver}`);
    });

    // ── Graceful shutdown ─────────────────────────────────────────────────
    const shutdown = async (signal) => {
      logger.info(`[${signal}] Graceful shutdown initiated…`);

      server.close(async () => {
        try {
          if (config.db.driver === 'mongo') {
            await require('./db/adapters/mongo.adapter').disconnect();
          } else {
            await require('./db/adapters/pg.adapter').disconnect();
          }
          logger.info('DB disconnected. Exiting.');
          process.exit(0);
        } catch (err) {
          logger.error('Error during shutdown:', err);
          process.exit(1);
        }
      });
    };

    process.on('SIGTERM', () => shutdown('SIGTERM'));
    process.on('SIGINT',  () => shutdown('SIGINT'));

    // Unhandled rejection — log and exit so the process manager restarts
    process.on('unhandledRejection', (reason) => {
      logger.error('Unhandled rejection:', reason);
      process.exit(1);
    });

    return server;

  } catch (err) {
    logger.error('Failed to start server:', err);
    process.exit(1);
  }
}

// ── Export for testing, boot for production ───────────────────────────────
if (require.main === module) {
  boot();
}

module.exports = { app, boot };