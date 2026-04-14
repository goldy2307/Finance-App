'use strict';

const config = require('../../config');

function getModel() {
  if (config.db.driver === 'mongo') return require('../models/mongo/loan.model');
  return require('../models/pg/index').getModels().Loan;
}

async function create(data) {
  const Model = getModel();
  if (config.db.driver === 'mongo') return (await Model.create(data)).toJSON();
  return (await Model.create(data)).toJSON();
}

async function findById(id) {
  const Model = getModel();
  if (config.db.driver === 'mongo') return Model.findById(id).populate('userId', 'firstName lastName email phone').lean();
  return Model.findByPk(id);
}

async function findByApplicationId(applicationId) {
  const Model = getModel();
  if (config.db.driver === 'mongo') return Model.findOne({ applicationId }).lean();
  return Model.findOne({ where: { applicationId } });
}

async function findByUser(userId, filters = {}) {
  const Model = getModel();
  if (config.db.driver === 'mongo') {
    return Model.find({ userId, ...filters })
      .sort({ createdAt: -1 })
      .lean();
  }
  return Model.findAll({ where: { userId, ...filters }, order: [['createdAt', 'DESC']] });
}

async function findAll(filters = {}, { page = 1, limit = 20 } = {}) {
  const Model = getModel();
  const skip  = (page - 1) * limit;
  if (config.db.driver === 'mongo') {
    const [data, total] = await Promise.all([
      Model.find(filters).sort({ createdAt: -1 }).skip(skip).limit(limit).lean(),
      Model.countDocuments(filters),
    ]);
    return { data, total, page, limit };
  }
  const { count, rows } = await Model.findAndCountAll({
    where: filters, order: [['createdAt', 'DESC']], offset: skip, limit,
  });
  return { data: rows, total: count, page, limit };
}

async function updateById(id, data) {
  const Model = getModel();
  if (config.db.driver === 'mongo') {
    return Model.findByIdAndUpdate(id, { $set: data }, { new: true, runValidators: true }).lean();
  }
  await Model.update(data, { where: { id } });
  return findById(id);
}

async function updateStatus(id, status, extra = {}) {
  return updateById(id, { status, ...extra });
}

module.exports = { create, findById, findByApplicationId, findByUser, findAll, updateById, updateStatus };