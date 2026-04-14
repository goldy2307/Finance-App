'use strict';

const { Sequelize } = require('sequelize');
const config        = require('../../config');
const logger        = require('../../utils/logger');

let sequelize = null;

function getInstance() {
  if (sequelize) return sequelize;

  const { host, port, database, username, password, ssl } = config.pg;

  sequelize = new Sequelize(database, username, password, {
    host,
    port,
    dialect: 'postgres',
    logging: (sql) => logger.debug(`[PG] ${sql}`),
    pool: {
      max:     10,
      min:     2,
      acquire: 30000,
      idle:    10000,
    },
    dialectOptions: ssl
      ? { ssl: { require: true, rejectUnauthorized: false } }
      : {},
  });

  return sequelize;
}

async function connect() {
  const instance = getInstance();
  await instance.authenticate();
  logger.info('[PostgreSQL] Connection authenticated');
}

async function disconnect() {
  if (sequelize) {
    await sequelize.close();
    sequelize = null;
    logger.info('[PostgreSQL] Disconnected gracefully');
  }
}

module.exports = { connect, disconnect, getInstance };