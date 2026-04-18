'use strict';

const config = require('../../config');

function getModel() {
  if (config.db.driver === 'mongo') return require('../models/mongo/settings.model');
  return require('../models/pg/index').getModels().Settings;
}

// Defaults — returned if no settings doc exists yet
const DEFAULTS = {
  ratePersonal:       10.5,
  rateBusiness:       12.0,
  rateHome:           8.5,
  rateEducation:      9.0,
  processingFee:      1.0,
  minCibil:           750,
  maxAutoAmount:      200000,
  autoApproveEnabled: true,
  smsOnDisbursal:     true,
  dualAdminRequired:  false,
  penaltyLate:        2.0,
  bounceCharge:       500,
  prepayPenalty:      2.0,
  legalThreshold:     90,
  npaThreshold:       90,
  autoLatePenalty:    true,
  notifyOnPenalty:    true,
  siteHeroTitle:      '',
  siteHeroSub:        '',
  siteCtaText:        'Apply Now',
  siteFooter:         '',
};

async function get() {
  try {
    const Model = getModel();
    if (config.db.driver === 'mongo') {
      const doc = await Model.findOne().lean();
      return doc || DEFAULTS;
    }
    const row = await Model.findOne();
    return row || DEFAULTS;
  } catch (e) {
    console.error('[settings.repo] get error:', e.message);
    return DEFAULTS;
  }
}

async function upsert(payload) {
  try {
    const Model = getModel();
    // Strip unknown keys — only allow keys in DEFAULTS
    const safe = {};
    Object.keys(DEFAULTS).forEach(k => {
      if (payload[k] !== undefined) safe[k] = payload[k];
    });

    if (config.db.driver === 'mongo') {
      return Model.findOneAndUpdate(
        {},
        { $set: safe },
        { new: true, upsert: true, runValidators: true }
      ).lean();
    }
    const [row] = await Model.upsert(safe);
    return row;
  } catch (e) {
    console.error('[settings.repo] upsert error:', e.message);
    throw e;
  }
}

module.exports = { get, upsert };