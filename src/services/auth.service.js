'use strict';

const jwt        = require('jsonwebtoken');
const bcrypt     = require('bcryptjs');
const config     = require('../config');
const userRepo   = require('../db/repositories/user.repo');
const accountRepo= require('../db/repositories/account.repo');
const audit      = require('./audit.logger');
const logger     = require('../utils/logger');

// ── Token helpers ─────────────────────────────────────────────────────────
function signAccess(payload) {
  return jwt.sign(payload, config.jwt.secret, { expiresIn: config.jwt.expiresIn });
}

function signRefresh(payload) {
  return jwt.sign(payload, config.jwt.refreshSecret, { expiresIn: config.jwt.refreshExpiresIn });
}

function verifyAccess(token) {
  return jwt.verify(token, config.jwt.secret);
}

function verifyRefresh(token) {
  return jwt.verify(token, config.jwt.refreshSecret);
}

function tokenPair(user) {
  const payload = { sub: user._id || user.id, role: user.role };
  return {
    accessToken:  signAccess(payload),
    refreshToken: signRefresh(payload),
  };
}

// ── Register ──────────────────────────────────────────────────────────────
async function register(data, meta = {}) {
  const { firstName, lastName, email, phone, password } = data;

  // uniqueness checks
  if (await userRepo.existsByEmail(email)) {
    const err = new Error('An account with this email already exists.');
    err.statusCode = 409;
    throw err;
  }
  if (await userRepo.existsByPhone(phone)) {
    const err = new Error('An account with this mobile number already exists.');
    err.statusCode = 409;
    throw err;
  }

  const user = await userRepo.create({ firstName, lastName, email, phone, password });

  // Automatically create a blank Account record
  await accountRepo.create({ userId: user._id || user.id });

  audit.log({
    action:       audit.ACTIONS.USER_REGISTERED,
    actorId:      String(user._id || user.id),
    actorRole:    'borrower',
    resourceId:   String(user._id || user.id),
    resourceType: 'user',
    after:        { email, phone },
    ...meta,
  });

  const tokens = tokenPair(user);
  return { user, ...tokens };
}

// ── Login ─────────────────────────────────────────────────────────────────
async function login({ identifier, password }, meta = {}) {
  // identifier can be email or phone
  const isEmail = identifier.includes('@');
  const user    = isEmail
    ? await userRepo.findByEmail(identifier, true)
    : await userRepo.findByPhone(identifier, true);

  if (!user) {
    const err = new Error('Invalid credentials.');
    err.statusCode = 401;
    throw err;
  }

  if (!user.isActive) {
    const err = new Error('This account has been deactivated.');
    err.statusCode = 403;
    throw err;
  }

  const valid = await bcrypt.compare(password, user.password);
  if (!valid) {
    const err = new Error('Invalid credentials.');
    err.statusCode = 401;
    throw err;
  }

  const userId = String(user._id || user.id);
  await userRepo.updateById(userId, { lastLoginAt: new Date() });

  audit.log({
    action:       audit.ACTIONS.USER_LOGIN,
    actorId:      userId,
    actorRole:    user.role,
    resourceId:   userId,
    resourceType: 'user',
    ...meta,
  });

  // Strip sensitive fields before returning
  const { password: _p, refreshTokens: _rt, ...safeUser } = user;
  const tokens = tokenPair(user);
  return { user: safeUser, ...tokens };
}

// ── Refresh access token ──────────────────────────────────────────────────
async function refresh(refreshToken) {
  let payload;
  try {
    payload = verifyRefresh(refreshToken);
  } catch {
    const err = new Error('Invalid or expired refresh token.');
    err.statusCode = 401;
    throw err;
  }

  const user = await userRepo.findById(payload.sub);
  if (!user || !user.isActive) {
    const err = new Error('User not found or inactive.');
    err.statusCode = 401;
    throw err;
  }

  return { accessToken: signAccess({ sub: payload.sub, role: user.role }) };
}

// ── Change password ───────────────────────────────────────────────────────
async function changePassword(userId, { currentPassword, newPassword }, meta = {}) {
  const user = await userRepo.findById(userId, true);
  if (!user) throw Object.assign(new Error('User not found.'), { statusCode: 404 });

  const valid = await bcrypt.compare(currentPassword, user.password);
  if (!valid) throw Object.assign(new Error('Current password is incorrect.'), { statusCode: 400 });

  const hashed = await bcrypt.hash(newPassword, config.bcrypt.rounds);
  await userRepo.updateById(userId, { password: hashed });

  audit.log({
    action:       audit.ACTIONS.PASSWORD_CHANGED,
    actorId:      userId,
    actorRole:    user.role,
    resourceId:   userId,
    resourceType: 'user',
    ...meta,
  });
}

// ── Get profile ───────────────────────────────────────────────────────────
async function getProfile(userId) {
  const user = await userRepo.findById(userId);
  if (!user) throw Object.assign(new Error('User not found.'), { statusCode: 404 });
  return user;
}

// ── Update profile ────────────────────────────────────────────────────────
async function updateProfile(userId, data) {
  // Prevent escalation — never allow role/password change via this method
  const { password, role, ...safe } = data;
  const user = await userRepo.updateById(userId, safe);
  if (!user) throw Object.assign(new Error('User not found.'), { statusCode: 404 });
  return user;
}

module.exports = { register, login, refresh, changePassword, getProfile, updateProfile, verifyAccess };