'use strict';

const mongoose = require('mongoose');

const loanSchema = new mongoose.Schema(
  {
    userId:       { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    applicationId:{ type: String, required: true, unique: true },   // e.g. CLY-A7X3K1

    // Loan configuration
    type:         { type: String, enum: ['personal','business','home','education'], required: true },
    principal:    { type: Number, required: true, min: 10000 },      // in rupees
    interestRate: { type: Number, required: true },                  // annual % e.g. 10.5
    tenureMonths: { type: Number, required: true },
    emi:          { type: Number },                                  // calculated, stored for reference
    purpose:      { type: String },

    // Lifecycle
    status: {
      type: String,
      enum: ['pending','under_review','approved','rejected','active','closed','foreclosed'],
      default: 'pending',
      index: true,
    },

    // Disbursement
    disbursedAt:  { type: Date },
    disbursedTo:  { type: String },    // bank account masked

    // Repayment tracking
    outstandingPrincipal: { type: Number },
    nextEmiDue:           { type: Date },
    emisPaid:             { type: Number, default: 0 },
    totalEmis:            { type: Number },

    // Audit fields
    approvedBy:   { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    approvedAt:   { type: Date },
    closedAt:     { type: Date },
    rejectionNote:{ type: String },
  },
  {
    timestamps: true,
    versionKey: false,
  }
);

// Compound index for common query patterns
loanSchema.index({ userId: 1, status: 1 });
loanSchema.index({ applicationId: 1 }, { unique: true });

module.exports = mongoose.model('Loan', loanSchema);