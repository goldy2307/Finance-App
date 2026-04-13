'use strict';

/**
 * User Repository
 * Services call ONLY this file for user data access.
 * All DB-specific logic lives here — services stay DB-agnostic.
 */

const User = require('../models/mongo/user.model');

async function findById(id) {
  return User.findById(id).lean();
}

async function findByEmail(email) {
  return User.findOne({ email: email.toLowerCase() }).lean();
}

async function findByPhone(phone) {
  return User.findOne({ phone }).lean();
}

/** Used only for login — need passwordHash which is select:false */
async function findByEmailWithPassword(email) {
  return User.findOne({ email: email.toLowerCase() }).select('+passwordHash');
}

async function findByPhoneWithPassword(phone) {
  return User.findOne({ phone }).select('+passwordHash');
}

async function create(data) {
  const user = new User(data);
  return user.save();
}

async function updateById(id, updates) {
  return User.findByIdAndUpdate(
    id,
    { $set: updates },
    { new: true, runValidators: true }
  ).lean();
}

async function setLastLogin(id) {
  return User.findByIdAndUpdate(id, { $set: { lastLoginAt: new Date() } });
}

async function existsByEmail(email) {
  return User.exists({ email: email.toLowerCase() });
}

async function existsByPhone(phone) {
  return User.exists({ phone });
}

module.exports = {
  findById,
  findByEmail,
  findByPhone,
  findByEmailWithPassword,
  findByPhoneWithPassword,
  create,
  updateById,
  setLastLogin,
  existsByEmail,
  existsByPhone,
};