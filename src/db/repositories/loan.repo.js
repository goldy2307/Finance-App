'use strict';

const Loan = require('../models/mongo/loan.model');

async function findById(id) {
  return Loan.findById(id).lean();
}

async function findByApplicationId(applicationId) {
  return Loan.findOne({ applicationId }).lean();
}

async function findByUserId(userId, { status, page = 1, limit = 10 } = {}) {
  const filter = { userId };
  if (status) filter.status = status;

  const skip  = (page - 1) * limit;
  const [data, total] = await Promise.all([
    Loan.find(filter).sort({ createdAt: -1 }).skip(skip).limit(limit).lean(),
    Loan.countDocuments(filter),
  ]);
  return { data, total, page, limit };
}

async function findAll({ status, type, page = 1, limit = 20 } = {}) {
  const filter = {};
  if (status) filter.status = status;
  if (type)   filter.type   = type;

  const skip  = (page - 1) * limit;
  const [data, total] = await Promise.all([
    Loan.find(filter).sort({ createdAt: -1 }).skip(skip).limit(limit)
      .populate('userId', 'firstName lastName email phone').lean(),
    Loan.countDocuments(filter),
  ]);
  return { data, total, page, limit };
}

async function create(data) {
  const loan = new Loan(data);
  return loan.save();
}

async function updateById(id, updates) {
  return Loan.findByIdAndUpdate(
    id,
    { $set: updates },
    { new: true, runValidators: true }
  ).lean();
}

async function updateStatus(id, status, extra = {}) {
  return Loan.findByIdAndUpdate(
    id,
    { $set: { status, ...extra } },
    { new: true }
  ).lean();
}

module.exports = {
  findById,
  findByApplicationId,
  findByUserId,
  findAll,
  create,
  updateById,
  updateStatus,
};