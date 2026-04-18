'use strict';
const mongoose = require('mongoose');
const s = new mongoose.Schema({
  ratePersonal: Number, rateBusiness: Number, rateHome: Number,
  rateEducation: Number, processingFee: Number, minCibil: Number,
  maxAutoAmount: Number, autoApproveEnabled: Boolean, smsOnDisbursal: Boolean,
  dualAdminRequired: Boolean, penaltyLate: Number, bounceCharge: Number,
  prepayPenalty: Number, legalThreshold: Number, npaThreshold: Number,
  autoLatePenalty: Boolean, notifyOnPenalty: Boolean,
  siteHeroTitle: String, siteHeroSub: String, siteCtaText: String, siteFooter: String,
}, { timestamps: true, versionKey: false });
module.exports = mongoose.model('Settings', s);