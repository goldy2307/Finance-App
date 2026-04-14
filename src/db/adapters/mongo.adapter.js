'use strict';

const mongoose = require('mongoose');
const config   = require('../../config');
const logger   = require('../../utils/logger');

let _connected = false;

async function connect() {
  if (_connected) return;

  mongoose.set('strictQuery', true);

  await mongoose.connect(config.mongo.uri, {
    serverSelectionTimeoutMS: 5000,
    socketTimeoutMS:          45000,
  });

  _connected = true;

  mongoose.connection.on('error', (err) => {
    logger.error(`[MongoDB] Connection error: ${err.message}`);
  });
  mongoose.connection.on('disconnected', () => {
    logger.warn('[MongoDB] Disconnected');
    _connected = false;
  });
}

async function disconnect() {
  if (!_connected) return;
  await mongoose.connection.close();
  _connected = false;
  logger.info('[MongoDB] Disconnected gracefully');
}

/** Expose the mongoose connection for health checks */
const getConnection = () => mongoose.connection;

module.exports = { connect, disconnect, getConnection };