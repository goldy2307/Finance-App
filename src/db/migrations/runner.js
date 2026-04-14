'use strict';

/**
 * Migration runner
 *
 * Usage:
 *   node src/db/migrations/runner.js up       # run all pending
 *   node src/db/migrations/runner.js down     # rollback last batch
 *   node src/db/migrations/runner.js status   # list applied migrations
 *
 * Migration files live in this same directory:
 *   001_create_users.js
 *   002_create_loans.js
 *   ...
 *
 * Each migration file exports: { up(db), down(db) }
 *   - For MongoDB  : db is the mongoose connection
 *   - For PostgreSQL: db is the Sequelize instance
 */

require('dotenv').config();
const path   = require('path');
const fs     = require('fs');
const config = require('../../config');
const logger = require('../../utils/logger');

const MIGRATIONS_DIR = __dirname;
const COMMAND = process.argv[2] || 'up';

// ── Gather migration files ─────────────────────────────────────────────────
function getMigrationFiles() {
  return fs
    .readdirSync(MIGRATIONS_DIR)
    .filter((f) => /^\d{3}_.*\.js$/.test(f))
    .sort()
    .filter((f) => f !== 'runner.js');
}

// ── MongoDB migrations ─────────────────────────────────────────────────────
async function runMongo(command) {
  const mongoose = require('mongoose');
  await mongoose.connect(config.mongo.uri);
  const db = mongoose.connection;

  // Track applied migrations in a collection
  const col = db.collection('_migrations');

  const files   = getMigrationFiles();
  const applied = (await col.find({}).toArray()).map((d) => d.name);

  if (command === 'status') {
    files.forEach((f) => {
      const status = applied.includes(f) ? '✓ applied' : '○ pending';
      console.log(`  ${status}  ${f}`);
    });
    await mongoose.disconnect();
    return;
  }

  if (command === 'up') {
    const pending = files.filter((f) => !applied.includes(f));
    if (!pending.length) { logger.info('All migrations already applied.'); }

    for (const file of pending) {
      const migration = require(path.join(MIGRATIONS_DIR, file));
      logger.info(`Running migration: ${file}`);
      await migration.up(db);
      await col.insertOne({ name: file, appliedAt: new Date() });
      logger.info(`  ✓ ${file}`);
    }
  }

  if (command === 'down') {
    const last = applied[applied.length - 1];
    if (!last) { logger.info('Nothing to roll back.'); }
    else {
      const migration = require(path.join(MIGRATIONS_DIR, last));
      logger.info(`Rolling back: ${last}`);
      await migration.down(db);
      await col.deleteOne({ name: last });
      logger.info(`  ✓ Rolled back ${last}`);
    }
  }

  await mongoose.disconnect();
}

// ── PostgreSQL migrations ──────────────────────────────────────────────────
async function runPG(command) {
  const { Sequelize } = require('sequelize');
  const { host, port, database, username, password } = config.pg;
  const seq = new Sequelize(database, username, password, {
    host, port, dialect: 'postgres', logging: false,
  });
  await seq.authenticate();

  // Migration tracking table
  await seq.query(`
    CREATE TABLE IF NOT EXISTS _migrations (
      name        TEXT PRIMARY KEY,
      applied_at  TIMESTAMPTZ DEFAULT NOW()
    )
  `);

  const files   = getMigrationFiles();
  const [rows]  = await seq.query('SELECT name FROM _migrations');
  const applied = rows.map((r) => r.name);

  if (command === 'status') {
    files.forEach((f) => {
      const status = applied.includes(f) ? '✓ applied' : '○ pending';
      console.log(`  ${status}  ${f}`);
    });
    await seq.close();
    return;
  }

  if (command === 'up') {
    const pending = files.filter((f) => !applied.includes(f));
    if (!pending.length) logger.info('All migrations already applied.');

    for (const file of pending) {
      const migration = require(path.join(MIGRATIONS_DIR, file));
      logger.info(`Running migration: ${file}`);
      const t = await seq.transaction();
      try {
        await migration.up(seq, t);
        await seq.query(`INSERT INTO _migrations (name) VALUES ('${file}')`, { transaction: t });
        await t.commit();
        logger.info(`  ✓ ${file}`);
      } catch (err) {
        await t.rollback();
        logger.error(`  ✗ ${file}: ${err.message}`);
        throw err;
      }
    }
  }

  if (command === 'down') {
    const last = applied[applied.length - 1];
    if (!last) logger.info('Nothing to roll back.');
    else {
      const migration = require(path.join(MIGRATIONS_DIR, last));
      const t = await seq.transaction();
      try {
        await migration.down(seq, t);
        await seq.query(`DELETE FROM _migrations WHERE name = '${last}'`, { transaction: t });
        await t.commit();
        logger.info(`  ✓ Rolled back ${last}`);
      } catch (err) {
        await t.rollback();
        throw err;
      }
    }
  }

  await seq.close();
}

// ── Entry ─────────────────────────────────────────────────────────────────
(async () => {
  try {
    if (config.db.driver === 'mongo') {
      await runMongo(COMMAND);
    } else {
      await runPG(COMMAND);
    }
    process.exit(0);
  } catch (err) {
    logger.error('Migration failed:', err);
    process.exit(1);
  }
})();