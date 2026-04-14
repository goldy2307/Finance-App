'use strict';

const config = require('../../config');

function getModel() {
  if (config.db.driver === 'mongo') return require('../models/mongo/transaction.model');
  return require('../models/pg/index').getModels().Transaction;
}

async function create(data) {
  const Model = getModel();
  if (config.db.driver === 'mongo') return (await Model.create(data)).toJSON();
  return (await Model.create(data)).toJSON();
}

async function findById(id) {
  const Model = getModel();
  if (config.db.driver === 'mongo') return Model.findById(id).lean();
  return Model.findByPk(id);
}

async function findByTxnId(txnId) {
  const Model = getModel();
  if (config.db.driver === 'mongo') return Model.findOne({ txnId }).lean();
  return Model.findOne({ where: { txnId } });
}

async function findByLoan(loanId, filters = {}) {
  const Model = getModel();
  if (config.db.driver === 'mongo') {
    return Model.find({ loanId, ...filters }).sort({ createdAt: -1 }).lean();
  }
  return Model.findAll({ where: { loanId, ...filters }, order: [['createdAt', 'DESC']] });
}

async function findByUser(userId, { page = 1, limit = 20, type, status } = {}) {
  const Model  = getModel();
  const skip   = (page - 1) * limit;
  const filter = { userId };
  if (type)   filter.type   = type;
  if (status) filter.status = status;

  if (config.db.driver === 'mongo') {
    const [data, total] = await Promise.all([
      Model.find(filter).sort({ createdAt: -1 }).skip(skip).limit(limit).lean(),
      Model.countDocuments(filter),
    ]);
    return { data, total, page, limit };
  }
  const { count, rows } = await Model.findAndCountAll({
    where: filter, order: [['createdAt', 'DESC']], offset: skip, limit,
  });
  return { data: rows, total: count, page, limit };
}

async function updateById(id, data) {
  const Model = getModel();
  if (config.db.driver === 'mongo') {
    return Model.findByIdAndUpdate(id, { $set: data }, { new: true }).lean();
  }
  await Model.update(data, { where: { id } });
  return findById(id);
}

async function sumByLoanAndType(loanId, type) {
  const Model = getModel();
  if (config.db.driver === 'mongo') {
    const res = await Model.aggregate([
      { $match: { loanId: require('mongoose').Types.ObjectId.createFromHexString(loanId), type, status: 'success' } },
      { $group: { _id: null, total: { $sum: '$amountPaise' } } },
    ]);
    return res[0]?.total ?? 0;
  }
  const { Sequelize } = require('sequelize');
  const res = await Model.findOne({
    where: { loanId, type, status: 'success' },
    attributes: [[Sequelize.fn('SUM', Sequelize.col('amount_paise')), 'total']],
    raw: true,
  });
  return parseInt(res?.total ?? 0, 10);
}

module.exports = { create, findById, findByTxnId, findByLoan, findByUser, updateById, sumByLoanAndType };