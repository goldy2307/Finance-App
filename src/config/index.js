'use strict';

require('dotenv').config();

// Fail fast — crash at startup if any critical env var is missing
const required = ['JWT_SECRET', 'DB_DRIVER'];
required.forEach((key) => {
  if (!process.env[key]) {
    throw new Error(`Missing required environment variable: ${key}`);
  }
});

const config = {
  env:  process.env.NODE_ENV  || 'development',
  port: parseInt(process.env.PORT || '5000', 10),
  isDev:  process.env.NODE_ENV === 'development',
  isProd: process.env.NODE_ENV === 'production',

  db: {
    driver: process.env.DB_DRIVER, // 'mongo' | 'pg'
  },

  mongo: {
    uri: process.env.MONGO_URI || 'mongodb+srv://switchitpvt_db_user:o1pMAVHgVoi6SxAf@kashly365.3vx3us7.mongodb.net/?appName=Kashly365',
  },

  pg: {
    host:     process.env.PG_HOST     || 'localhost',
    port:     parseInt(process.env.PG_PORT || '5432', 10),
    database: process.env.PG_DATABASE || 'cashly_dev',
    username: process.env.PG_USER     || 'postgres',
    password: process.env.PG_PASSWORD || '',
    ssl:      process.env.PG_SSL === 'true',
  },

  jwt: {
    secret:             process.env.JWT_SECRET,
    expiresIn:          process.env.JWT_EXPIRES_IN         || '7d',
    refreshSecret:      process.env.JWT_REFRESH_SECRET     || process.env.JWT_SECRET,
    refreshExpiresIn:   process.env.JWT_REFRESH_EXPIRES_IN || '30d',
  },

  bcrypt: {
    rounds: parseInt(process.env.BCRYPT_ROUNDS || '12', 10),
  },

  rateLimit: {
    windowMs: parseInt(process.env.RATE_LIMIT_WINDOW_MS || '900000', 10),
    max:      parseInt(process.env.RATE_LIMIT_MAX        || '100',    10),
  },

  cors: {
    origins: (process.env.ALLOWED_ORIGINS || 'http://localhost:5000')
      .split(',')
      .map((o) => o.trim()),
  },

  log: {
    level: process.env.LOG_LEVEL || 'info',
    dir:   process.env.LOG_DIR   || 'logs',
  },

  email: {
    host:   process.env.SMTP_HOST  || 'smtp.mailtrap.io',
    port:   parseInt(process.env.SMTP_PORT || '587', 10),
    user:   process.env.SMTP_USER  || '',
    pass:   process.env.SMTP_PASS  || '',
    from:   process.env.EMAIL_FROM || 'noreply@cashly.in',
  },
};

module.exports = config;
