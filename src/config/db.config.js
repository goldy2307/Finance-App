'use strict';

const config = require('./index');
const logger = require('../utils/logger');

/**
 * Connects to whichever database DB_DRIVER points to.
 * Swap the env var — nothing else changes.
 */
async function connectDB() {
  const driver = config.db.driver;

  if (driver === 'mongo') {
    const mongoAdapter = require('../db/adapters/mongo.adapter');
    await mongoAdapter.connect();
    logger.info(`[DB] MongoDB connected`);
    return;
  }

  if (driver === 'pg') {
    const pgAdapter = require('../db/adapters/pg.adapter');
    await pgAdapter.connect();
    logger.info(`[DB] PostgreSQL connected`);
    return;
  }

  throw new Error(`Unknown DB_DRIVER: "${driver}". Use 'mongo' or 'pg'.`);
}

module.exports = { connectDB };