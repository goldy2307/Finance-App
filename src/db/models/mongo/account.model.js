'use strict';

const mongoose = require('mongoose');

const accountSchema = new mongoose.Schema(
  {
    userId: {
      type:     mongoose.Schema.Types.ObjectId,
      ref:      'User',
      required: true,
      unique:   true,
      index:    true,
    },

    // Current financial snapshot (paise)
    totalLoanedPaise:    { type: Number, default: 0 },
    totalRepaidPaise:    { type: Number, default: 0 },
    outstandingPaise:    { type: Number, default: 0 },
    overdueAmountPaise:  { type: Number, default: 0 },

    activeLoanCount:  { type: Number, default: 0 },
    closedLoanCount:  { type: Number, default: 0 },

    creditScore:      { type: Number, min: 300, max: 900 },
    creditScoreDate:  { type: Date },

    // Bank details for disbursement/collection
    bankAccount: {
      accountNumber: { type: String, select: false },
      ifsc:          String,
      bankName:      String,
      accountHolder: String,
      verified:      { type: Boolean, default: false },
    },

    // Auto-debit mandate
    nachMandateId:     { type: String },
    nachMandateActive: { type: Boolean, default: false },

    // Risk / compliance flags
    isBlacklisted: { type: Boolean, default: false },
    kycStatus:     { type: String, enum: ['pending', 'submitted', 'verified', 'rejected'], default: 'pending' },
  },
  { timestamps: true, versionKey: false }
);

module.exports = mongoose.model('Account', accountSchema);