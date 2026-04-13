'use strict';

const Transaction = require('../models/mongo/transaction.model');

async function findById(id) {
  return Transaction.findById(id).lean();
}

async function findByTransactionId(transactionId) {
  return Transaction.findOne({ transactionId }).lean();
}

async function findByUserId(userId, { type, status, page = 1, limit = 20 } = {}) {
  const filter = { userId };
  if (type)   filter.type   = type;
  if (status) filter.status = status;

  const skip = (page - 1) * limit;
  const [data, total] = await Promise.all([
    Transaction.find(filter).sort({ recordedAt: -1 }).skip(skip).limit(limit).lean(),
    Transaction.countDocuments(filter),
  ]);
  return { data, total, page, limit };
}

async function findByLoanId(loanId, { page = 1, limit = 20 } = {}) {
  const skip = (page - 1) * limit;
  const [data, total] = await Promise.all([
    Transaction.find({ loanId }).sort({ recordedAt: -1 }).skip(skip).limit(limit).lean(),
    Transaction.countDocuments({ loanId }),
  ]);
  return { data, total, page, limit };
}

/** Aggregate total by type for a user — used in reports */
async function sumByType(userId, startDate, endDate) {
  return Transaction.aggregate([
    {
      $match: {
        userId:      require('mongoose').Types.ObjectId.createFromHexString(userId.toString()),
        status:      'completed',
        recordedAt:  { $gte: new Date(startDate), $lte: new Date(endDate) },
      },
    },
    {
      $group: {
        _id:   '$type',
        total: { $sum: '$amount' },
        count: { $sum: 1 },
      },
    },
  ]);
}

async function create(data) {
  const tx = new Transaction(data);
  return tx.save();
}

module.exports = {
  findById,
  findByTransactionId,
  findByUserId,
  findByLoanId,
  sumByType,
  create,
};