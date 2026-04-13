'use strict';

require('dotenv').config();

/**
 * Central config object — import this everywhere instead of
 * calling process.env directly in application code.
 * Validates required variables at startup so the app fails
 * fast with a clear message rather than silently misbehaving.
 */

const REQUIRED = [
  'JWT_SECRET',
  'JWT_REFRESH_SECRET',
];

function validate() {
  const missing = REQUIRED.filter(k => !process.env[k]);
  if (missing.length) {
    throw new Error(
      `[Config] Missing required environment variables: ${missing.join(', ')}\n` +
      'Copy .env.example to .env and fill in the values.'
    );
  }
}

// Only enforce in non-test environments
if (process.env.NODE_ENV !== 'test') validate();

const config = {
  env:  process.env.NODE_ENV || 'development',
  port: parseInt(process.env.PORT, 10) || 5000,
  apiVersion: process.env.API_VERSION || 'v1',

  db: {
    driver:   process.env.DB_DRIVER || 'mongo',   // 'mongo' | 'pg'
    mongoUri: process.env.MONGO_URI || 'mongodb://localhost:27017/cashly',
    pg: {
      host:     process.env.PG_HOST     || 'localhost',
      port:     parseInt(process.env.PG_PORT, 10) || 5432,
      user:     process.env.PG_USER     || 'cashly_user',
      password: process.env.PG_PASSWORD || '',
      database: process.env.PG_DATABASE || 'cashly_db',
      ssl:      process.env.PG_SSL === 'true',
    },
  },

  jwt: {
    secret:             process.env.JWT_SECRET         || 'dev-secret',
    expiresIn:          process.env.JWT_EXPIRES_IN     || '7d',
    refreshSecret:      process.env.JWT_REFRESH_SECRET || 'dev-refresh-secret',
    refreshExpiresIn:   process.env.JWT_REFRESH_EXPIRES_IN || '30d',
  },

  cors: {
    origin: process.env.CORS_ORIGIN || 'http://localhost:3000',
  },

  rateLimit: {
    windowMs: parseInt(process.env.RATE_LIMIT_WINDOW_MS, 10) || 15 * 60 * 1000,
    max:      parseInt(process.env.RATE_LIMIT_MAX, 10)        || 100,
  },

  log: {
    level: process.env.LOG_LEVEL || 'info',
    dir:   process.env.LOG_DIR   || 'logs',
  },

  bcrypt: {
    saltRounds: parseInt(process.env.BCRYPT_SALT_ROUNDS, 10) || 12,
  },
};

module.exports = config;