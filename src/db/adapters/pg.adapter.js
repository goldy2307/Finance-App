'use strict';

const { Sequelize } = require('sequelize');
const config        = require('../../config');
const logger        = require('../../utils/logger');

/**
 * PostgreSQL adapter — implements the same IDbAdapter interface
 * as mongo.adapter.js.  Swap DB_DRIVER=pg in .env to activate.
 */

const { host, port, user, password, database, ssl } = config.db.pg;

const sequelize = new Sequelize(database, user, password, {
  host,
  port,
  dialect: 'postgres',
  logging: msg => logger.debug(msg),
  dialectOptions: ssl ? { ssl: { require: true, rejectUnauthorized: false } } : {},
  pool: {
    max:     10,
    min:     2,
    acquire: 30000,
    idle:    10000,
  },
});

let _connected = false;

async function connect() {
  if (_connected) return;
  try {
    await sequelize.authenticate();
    _connected = true;
    logger.info('[PostgreSQL] Connected successfully');
  } catch (err) {
    logger.error(`[PostgreSQL] Connection failed: ${err.message}`);
    throw err;
  }
}

async function disconnect() {
  if (!_connected) return;
  await sequelize.close();
  _connected = false;
  logger.info('[PostgreSQL] Disconnected');
}

function isConnected() {
  return _connected;
}

function getClient() {
  return sequelize;
}

module.exports = { connect, disconnect, isConnected, getClient };