'use strict';

/**
 * Migration 001 — Create critical DB indexes
 *
 * MongoDB  : creates compound indexes on loans + transactions
 * PostgreSQL: handled by Sequelize model sync — this migration is a no-op
 */

async function up(db) {
  // MongoDB — db is mongoose.connection
  if (db.db) {
    await db.collection('loans').createIndex({ userId: 1, status: 1 });
    await db.collection('loans').createIndex({ applicationId: 1 }, { unique: true });
    await db.collection('transactions').createIndex({ loanId: 1, createdAt: -1 });
    await db.collection('transactions').createIndex({ userId: 1, createdAt: -1 });
    await db.collection('transactions').createIndex({ txnId: 1 }, { unique: true });
    await db.collection('users').createIndex({ email: 1 }, { unique: true });
    await db.collection('users').createIndex({ phone: 1 }, { unique: true });
    await db.collection('accounts').createIndex({ userId: 1 }, { unique: true });
  } else {
    // PostgreSQL — Sequelize handles indexes via model definitions
    // Add any raw SQL index creation here if needed
    await db.query(`
      CREATE INDEX IF NOT EXISTS idx_loans_user_status ON loans(user_id, status);
      CREATE INDEX IF NOT EXISTS idx_txns_loan_created ON transactions(loan_id, created_at DESC);
      CREATE INDEX IF NOT EXISTS idx_txns_user_created ON transactions(user_id, created_at DESC);
    `);
  }
}

async function down(db) {
  if (db.db) {
    await db.collection('loans').dropIndex({ userId: 1, status: 1 });
    await db.collection('transactions').dropIndex({ loanId: 1, createdAt: -1 });
  } else {
    await db.query(`
      DROP INDEX IF EXISTS idx_loans_user_status;
      DROP INDEX IF EXISTS idx_txns_loan_created;
      DROP INDEX IF EXISTS idx_txns_user_created;
    `);
  }
}

module.exports = { up, down };
