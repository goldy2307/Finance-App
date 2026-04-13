'use strict';

const config = require('./index');

/**
 * DB adapter factory.
 * Returns the correct adapter based on DB_DRIVER env var.
 * Services and repositories never import adapters directly —
 * they get the instance through this module.
 *
 * To migrate from MongoDB → PostgreSQL:
 *   1. Set DB_DRIVER=pg in .env
 *   2. Restart the app
 *   Zero application-layer changes needed.
 */

let _adapter = null;

function getAdapter() {
  if (_adapter) return _adapter;

  const driver = config.db.driver;

  if (driver === 'mongo') {
    _adapter = require('../db/adapters/mongo.adapter');
  } else if (driver === 'pg') {
    _adapter = require('../db/adapters/pg.adapter');
  } else {
    throw new Error(
      `[DB Config] Unknown DB_DRIVER: "${driver}". ` +
      'Valid options: "mongo" | "pg"'
    );
  }

  return _adapter;
}

module.exports = { getAdapter };