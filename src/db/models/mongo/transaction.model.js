'use strict';

const mongoose = require('mongoose');

/**
 * Transaction — immutable ledger entry.
 * Rule: transactions are NEVER updated or deleted.
 * Reversals are handled by creating a new opposing entry.
 */
const transactionSchema = new mongoose.Schema(
  {
    transactionId: { type: String, required: true, unique: true },  // UUID

    // Parties
    userId:  { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    loanId:  { type: mongoose.Schema.Types.ObjectId, ref: 'Loan', index: true },

    // Money
    type:    {
      type: String,
      enum: ['disbursement','emi_payment','prepayment','foreclosure','refund','fee','penalty'],
      required: true,
      index: true,
    },
    amount:  { type: Number, required: true },    // always positive, direction from type
    currency:{ type: String, default: 'INR' },

    // Ledger
    debitAccount:  { type: String },
    creditAccount: { type: String },
    balanceAfter:  { type: Number },              // snapshot of account balance post-tx

    // Status
    status:  { type: String, enum: ['pending','completed','failed','reversed'], default: 'completed', index: true },
    referenceId: { type: String },                // payment gateway ref

    // Immutability guard — set by pre-save, never changed
    recordedAt: { type: Date, default: Date.now, immutable: true },

    notes:   { type: String },
  },
  {
    timestamps: false,  // recordedAt is our canonical timestamp
    versionKey: false,
  }
);

// Prevent any update operations on transactions
transactionSchema.pre(['updateOne', 'findOneAndUpdate', 'updateMany'], function () {
  throw new Error('Transactions are immutable. Create a reversal entry instead.');
});

module.exports = mongoose.model('Transaction', transactionSchema);