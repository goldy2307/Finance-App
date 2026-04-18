'use strict';

const config = require('../../config');

function getModel() {
  if (config.db.driver === 'mongo') return require('../models/mongo/account.model');
  return require('../models/pg/index').getModels().Account;
}

async function create(data) {
  const Model = getModel();
  if (config.db.driver === 'mongo') return (await Model.create(data)).toJSON();
  return (await Model.create(data)).toJSON();
}

async function findByUserId(userId) {
  const Model = getModel();
  if (config.db.driver === 'mongo') return Model.findOne({ userId }).lean();
  return Model.findOne({ where: { userId } });
}

async function updateByUserId(userId, data) {
  const Model = getModel();
  if (config.db.driver === 'mongo') {
    return Model.findOneAndUpdate(
      { userId },
      { $set: data },
      { new: true, upsert: true, runValidators: true }
    ).lean();
  }
  await Model.upsert({ userId, ...data });
  return findByUserId(userId);
}

/**
 * Atomically increment/decrement numeric fields.
 * delta: e.g. { outstandingPaise: -5000, totalRepaidPaise: 5000 }
 */
async function incrementFields(userId, delta) {
  const Model = getModel();
  if (config.db.driver === 'mongo') {
    return Model.findOneAndUpdate(
      { userId },
      { $inc: delta },
      { new: true }
    ).lean();
  }
  // Sequelize: increment/decrement per field
  const instance = await Model.findOne({ where: { userId } });
  if (!instance) throw new Error(`Account not found for user ${userId}`);
  for (const [field, value] of Object.entries(delta)) {
    if (value > 0) await instance.increment(field, { by: value });
    if (value < 0) await instance.decrement(field, { by: Math.abs(value) });
  }
  return instance.reload();
}
async function findByKycStatus(statusArray, q = '') {
  const Model = getModel();
  if (config.db.driver === 'mongo') {
    const filter = { kycStatus: { $in: statusArray } };
    if (q) filter['$or'] = [{ userId: q }]; // extend if you have name via populate
    return Model.find(filter).lean();
  }
  const { Op } = require('sequelize');
  const where = { kycStatus: { [Op.in]: statusArray } };
  return Model.findAll({ where });
}
module.exports = { create, findByUserId, updateByUserId, incrementFields, findByKycStatus };