'use strict';

const mongoose = require('mongoose');

const loanSchema = new mongoose.Schema(
  {
    applicationId: {
      type:    String,
      unique:  true,
      default: () => 'CLY-' + Date.now().toString(36).toUpperCase(),
    },

    userId: {
      type:     mongoose.Schema.Types.ObjectId,
      ref:      'User',
      required: true,
      index:    true,
    },

    loanType: {
      type:     String,
      enum:     ['personal', 'business', 'home', 'education'],
      required: true,
    },

    // All monetary values stored in PAISE
    principalPaise: { type: Number, required: true, min: 1000000 }, // min ₹10,000
    disbursedPaise: { type: Number, default: 0 },
    outstandingPaise:{ type: Number, default: 0 },

    interestRatePct: { type: Number, required: true }, // e.g. 10.5
    tenureMonths:    { type: Number, required: true },
    emiPaise:        { type: Number },                 // calculated on create

    purpose: { type: String, trim: true },

    status: {
      type:    String,
      enum:    ['pending', 'under_review', 'approved', 'rejected', 'disbursed', 'closed', 'npa'],
      default: 'pending',
      index:   true,
    },

    startDate:    { type: Date },
    endDate:      { type: Date },
    nextDueDate:  { type: Date },

    // Employment snapshot at time of application
    employmentType:  { type: String, enum: ['salaried', 'self_employed', 'business'] },
    monthlyIncomePaise: { type: Number },

    // Documents
    documents: [
      {
        type:       { type: String }, // 'pan', 'aadhaar', 'salary', 'photo'
        url:        String,
        verifiedAt: Date,
        status:     { type: String, enum: ['pending', 'verified', 'rejected'], default: 'pending' },
      },
    ],

    // Agent / admin notes
    notes: [
      {
        text:      String,
        addedBy:   { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
        createdAt: { type: Date, default: Date.now },
      },
    ],

    rejectionReason: { type: String },
  },
  { timestamps: true, versionKey: false }
);

loanSchema.index({ userId: 1, status: 1 });
loanSchema.index({ applicationId: 1 });

module.exports = mongoose.model('Loan', loanSchema);