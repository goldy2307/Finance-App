'use strict';

/**
 * User Repository
 * Services call ONLY these methods — never touch models directly.
 * Internally routes to Mongo or PG based on DB_DRIVER.
 */

const config = require('../../config');

// ── Lazy-load the right model ─────────────────────────────────────────────
function getModel() {
  if (config.db.driver === 'mongo') {
    return require('../models/mongo/user.model');
  }
  return require('../models/pg/index').getModels().User;
}

// ── CREATE ────────────────────────────────────────────────────────────────
async function create(data) {
  const Model = getModel();
  if (config.db.driver === 'mongo') {
    const doc = await Model.create(data);
    return doc.toJSON();
  }
  const record = await Model.create(data);
  return record.toJSON();
}

// ── READ ──────────────────────────────────────────────────────────────────
async function findById(id, includePassword = false) {
  const Model = getModel();
  if (config.db.driver === 'mongo') {
    const q = Model.findById(id);
    if (includePassword) q.select('+password +refreshTokens');
    return q.lean();
  }
  return Model.findByPk(id, {
    attributes: includePassword ? undefined : { exclude: ['password', 'refreshTokens'] },
  });
}

async function findByEmail(email, includePassword = false) {
  const Model = getModel();
  if (config.db.driver === 'mongo') {
    const q = Model.findOne({ email: email.toLowerCase() });
    if (includePassword) q.select('+password +refreshTokens');
    return q.lean();
  }
  return Model.findOne({
    where: { email: email.toLowerCase() },
    attributes: includePassword ? undefined : { exclude: ['password'] },
  });
}

async function findByPhone(phone, includePassword = false) {
  const Model = getModel();
  if (config.db.driver === 'mongo') {
    const q = Model.findOne({ phone });
    if (includePassword) q.select('+password +refreshTokens');
    return q.lean();
  }
  return Model.findOne({
    where: { phone },
    attributes: includePassword ? undefined : { exclude: ['password'] },
  });
}

// ── UPDATE ────────────────────────────────────────────────────────────────
async function updateById(id, data) {
  const Model = getModel();
  if (config.db.driver === 'mongo') {
    return Model.findByIdAndUpdate(id, { $set: data }, { new: true, runValidators: true }).lean();
  }
  await Model.update(data, { where: { id } });
  return findById(id);
}

// ── DELETE (soft) ─────────────────────────────────────────────────────────
async function deactivate(id) {
  return updateById(id, { isActive: false });
}

// ── EXISTS ────────────────────────────────────────────────────────────────
async function existsByEmail(email) {
  const Model = getModel();
  if (config.db.driver === 'mongo') {
    return !!(await Model.exists({ email: email.toLowerCase() }));
  }
  const count = await Model.count({ where: { email: email.toLowerCase() } });
  return count > 0;
}

async function existsByPhone(phone) {
  const Model = getModel();
  if (config.db.driver === 'mongo') {
    return !!(await Model.exists({ phone }));
  }
  const count = await Model.count({ where: { phone } });
  return count > 0;
}

async function findAll({ role, page = 1, size = 8, q = '' } = {}) {
  const Model = getModel();
  const skip  = (page - 1) * size;
  if (config.db.driver === 'mongo') {
    const filter = {};
    if (role) filter.role = role;
    if (q) filter.$or = [
      { firstName: { $regex: q, $options: 'i' } },
      { lastName:  { $regex: q, $options: 'i' } },
      { email:     { $regex: q, $options: 'i' } },
      { phone:     { $regex: q, $options: 'i' } },
    ];
    const [items, total] = await Promise.all([
      Model.find(filter).skip(skip).limit(size).lean(),
      Model.countDocuments(filter),
    ]);
    return { items, total, page, pages: Math.ceil(total / size) };
  }
  // PG fallback
  const { Op } = require('sequelize');
  const where = {};
  if (role) where.role = role;
  if (q) where[Op.or] = [
    { firstName: { [Op.iLike]: `%${q}%` } },
    { email:     { [Op.iLike]: `%${q}%` } },
    { phone:     { [Op.iLike]: `%${q}%` } },
  ];
  const { count, rows } = await Model.findAndCountAll({ where, offset: skip, limit: size });
  return { items: rows, total: count, page, pages: Math.ceil(count / size) };
}

async function countActive() {
  const Model = getModel();
  if (config.db.driver === 'mongo') return Model.countDocuments({ isActive: true });
  const { Op } = require('sequelize');
  return Model.count({ where: { isActive: true } });
}

async function search(q, limit = 5) {
  const Model = getModel();
  if (config.db.driver === 'mongo') {
    return Model.find({ $or: [
      { firstName: { $regex: q, $options: 'i' } },
      { lastName:  { $regex: q, $options: 'i' } },
      { email:     { $regex: q, $options: 'i' } },
    ]}).limit(limit).lean();
  }
  const { Op } = require('sequelize');
  return Model.findAll({ where: { [Op.or]: [
    { firstName: { [Op.iLike]: `%${q}%` } },
    { email:     { [Op.iLike]: `%${q}%` } },
  ]}, limit });
}

module.exports = {
  create,
  findById,
  findByEmail,
  findByPhone,
  updateById,
  deactivate,
  existsByEmail,
  existsByPhone,
  findAll, 
  countActive,
  search,
};