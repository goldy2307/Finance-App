'use strict';

const mongoose = require('mongoose');

const txnSchema = new mongoose.Schema(
  {
    txnId: {
      type:    String,
      unique:  true,
      default: () => 'TXN-' + Date.now().toString(36).toUpperCase(),
    },

    loanId: {
      type:  mongoose.Schema.Types.ObjectId,
      ref:   'Loan',
      index: true,
    },

    userId: {
      type:     mongoose.Schema.Types.ObjectId,
      ref:      'User',
      required: true,
      index:    true,
    },

    type: {
      type:     String,
      enum:     ['disbursement', 'emi_payment', 'prepayment', 'foreclosure', 'fee', 'refund'],
      required: true,
    },

    amountPaise: { type: Number, required: true }, // always positive; direction from `type`

    // Breakdown for EMI payments
    principalPaise: { type: Number, default: 0 },
    interestPaise:  { type: Number, default: 0 },
    penaltyPaise:   { type: Number, default: 0 },

    currency:   { type: String, default: 'INR' },
    status:     { type: String, enum: ['pending', 'success', 'failed', 'reversed'], default: 'pending', index: true },

    paymentMode:    { type: String, enum: ['neft', 'imps', 'upi', 'nach', 'cash', 'internal'] },
    referenceId:    { type: String, trim: true }, // bank/payment gateway ref
    bankName:       { type: String, trim: true },

    dueDate:        { type: Date },
    processedAt:    { type: Date },

    // Immutable audit note — never update, only append
    description:    { type: String, trim: true },
    metadata:       { type: mongoose.Schema.Types.Mixed },
  },
  {
    timestamps: true,
    versionKey: false,
  }
);

// Compound index: all transactions for a loan ordered by date
txnSchema.index({ loanId: 1, createdAt: -1 });
txnSchema.index({ userId: 1, createdAt: -1 });
txnSchema.index({ txnId: 1 });

module.exports = mongoose.model('Transaction', txnSchema);