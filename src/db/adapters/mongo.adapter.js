'use strict';

const mongoose = require('mongoose');
const config   = require('../../config');
const logger   = require('../../utils/logger');

/**
 * MongoDB adapter — implements the IDbAdapter interface.
 *
 * Interface contract (both adapters must expose):
 *   connect()   → Promise<void>
 *   disconnect()→ Promise<void>
 *   isConnected()→ boolean
 *   getClient() → native client (mongoose | sequelize instance)
 */

let _connected = false;

async function connect() {
  if (_connected) return;

  try {
    await mongoose.connect(config.db.mongoUri, {
      serverSelectionTimeoutMS: 5000,
      socketTimeoutMS:          45000,
    });
    _connected = true;
    logger.info('[MongoDB] Connected successfully');
  } catch (err) {
    logger.error(`[MongoDB] Connection failed: ${err.message}`);
    throw err;
  }
}

async function disconnect() {
  if (!_connected) return;
  await mongoose.disconnect();
  _connected = false;
  logger.info('[MongoDB] Disconnected');
}

function isConnected() {
  return mongoose.connection.readyState === 1;
}

function getClient() {
  return mongoose;
}

// Mongoose event listeners
mongoose.connection.on('error', err => {
  logger.error(`[MongoDB] Runtime error: ${err.message}`);
  _connected = false;
});

mongoose.connection.on('disconnected', () => {
  logger.warn('[MongoDB] Lost connection — will auto-reconnect');
  _connected = false;
});

module.exports = { connect, disconnect, isConnected, getClient };