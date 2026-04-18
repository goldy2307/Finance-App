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
async function findAllAdmin({ status, page = 1, size = 8, q = '' } = {}) {
  const Model = getModel();
  const skip  = (page - 1) * size;
  if (config.db.driver === 'mongo') {
    const filter = {};
    if (status && status !== 'all') filter.status = status;
    if (q) filter.$or = [
      { applicationId: { $regex: q, $options: 'i' } },
      { 'userId.firstName': { $regex: q, $options: 'i' } },
    ];
    const [items, total] = await Promise.all([
      Model.find(filter).populate('userId','firstName lastName email phone').sort({ createdAt: -1 }).skip(skip).limit(size).lean(),
      Model.countDocuments(filter),
    ]);
    // Flatten applicant name onto each item
    const mapped = items.map(l => ({
      ...l,
      id:            l.applicationId || l._id,
      name:          l.userId ? `${l.userId.firstName} ${l.userId.lastName}` : '—',
      mobile:        l.userId?.phone,
      email:         l.userId?.email,
    }));
    return { items: mapped, total, page, pages: Math.ceil(total / size) };
  }
  const { Op } = require('sequelize');
  const where = {};
  if (status && status !== 'all') where.status = status;
  if (q) where[Op.or] = [{ applicationId: { [Op.iLike]: `%${q}%` } }];
  const { count, rows } = await Model.findAndCountAll({ where, offset: skip, limit: size, order: [['createdAt','DESC']] });
  return { items: rows, total: count, page, pages: Math.ceil(count / size) };
}

async function sumDisbursed() {
  const Model = getModel();
  if (config.db.driver === 'mongo') {
    const r = await Model.aggregate([{ $match: { status: 'disbursed' } }, { $group: { _id: null, total: { $sum: '$amount' } } }]);
    return { value: r[0]?.total || 0, delta: null, dir: 'up' };
  }
  const { fn, col } = require('sequelize');
  const r = await Model.findOne({ attributes: [[fn('SUM', col('amount')), 'total']], where: { status: 'disbursed' } });
  return { value: Number(r?.dataValues?.total) || 0, delta: null, dir: 'up' };
}

async function countByStatus(status) {
  const Model = getModel();
  if (config.db.driver === 'mongo') return Model.countDocuments({ status });
  return Model.count({ where: { status } });
}

async function getNpaRate() {
  const Model = getModel();
  const cutoff = new Date(Date.now() - 90 * 86400000);
  if (config.db.driver === 'mongo') {
    const [npa, total] = await Promise.all([
      Model.countDocuments({ status: 'active', updatedAt: { $lt: cutoff } }),
      Model.countDocuments({ status: { $in: ['active', 'disbursed'] } }),
    ]);
    const rate = total ? ((npa / total) * 100).toFixed(1) : '0.0';
    return { value: `${rate}%`, delta: null, dir: 'up', isPercent: true, warning: parseFloat(rate) > 2 };
  }
  return { value: '—', delta: null, dir: 'up', isPercent: true };
}

async function search(q, limit = 5) {
  const Model = getModel();
  if (config.db.driver === 'mongo') {
    return Model.find({ applicationId: { $regex: q, $options: 'i' } }).limit(limit).lean();
  }
  const { Op } = require('sequelize');
  return Model.findAll({ where: { applicationId: { [Op.iLike]: `%${q}%` } }, limit });
}

module.exports = {
  create, findById, findByApplicationId, findByUser,
  findAll, findAllAdmin, updateById, updateStatus,
  sumDisbursed, countByStatus, getNpaRate, search,
};