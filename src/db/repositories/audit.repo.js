'use strict';

const config = require('../../config');

function getModel() {
  if (config.db.driver === 'mongo') return require('../models/mongo/audit.model');
  return require('../models/pg/index').getModels().AuditLog;
}

async function log({ action, actorId, actorRole, resourceId, resourceType, before, after, ip } = {}) {
  try {
    const Model = getModel();
    const entry = { action, actorId, actorRole, resourceId, resourceType, before, after, ip };
    if (config.db.driver === 'mongo') {
      await Model.create(entry);
    } else {
      await Model.create(entry);
    }
  } catch (e) {
    // Audit logging must never crash the main flow
    console.error('[audit.repo] log error:', e.message);
  }
}

async function find({ q = '', role = '', action = '', from = '', to = '', page = 1, size = 8 } = {}) {
  const Model = getModel();
  const skip  = (page - 1) * size;

  if (config.db.driver === 'mongo') {
    const filter = {};
    if (role)   filter.actorRole = role;
    if (action) filter.action    = action;
    if (from || to) {
      filter.createdAt = {};
      if (from) filter.createdAt.$gte = new Date(from);
      if (to)   filter.createdAt.$lte = new Date(to);
    }
    if (q) filter.$or = [
      { actorId:       { $regex: q, $options: 'i' } },
      { action:        { $regex: q, $options: 'i' } },
      { resourceType:  { $regex: q, $options: 'i' } },
      { resourceId:    { $regex: q, $options: 'i' } },
    ];
    const [items, total] = await Promise.all([
      Model.find(filter).sort({ createdAt: -1 }).skip(skip).limit(size).lean(),
      Model.countDocuments(filter),
    ]);
    return { items, total, page, pages: Math.ceil(total / size) };
  }

  // PG
  const { Op } = require('sequelize');
  const where = {};
  if (role)   where.actorRole = role;
  if (action) where.action    = action;
  if (from || to) {
    where.createdAt = {};
    if (from) where.createdAt[Op.gte] = new Date(from);
    if (to)   where.createdAt[Op.lte] = new Date(to);
  }
  if (q) where[Op.or] = [
    { actorId:      { [Op.iLike]: `%${q}%` } },
    { action:       { [Op.iLike]: `%${q}%` } },
    { resourceType: { [Op.iLike]: `%${q}%` } },
  ];
  const { count, rows } = await Model.findAndCountAll({
    where, offset: skip, limit: size, order: [['createdAt', 'DESC']],
  });
  return { items: rows, total: count, page, pages: Math.ceil(count / size) };
}

module.exports = { log, find };