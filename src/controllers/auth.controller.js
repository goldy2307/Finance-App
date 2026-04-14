'use strict';

const authService = require('../services/auth.service');
const R           = require('../utils/response');

// POST /api/v1/auth/register
async function register(req, res) {
  const meta   = { ip: req.ip, userAgent: req.headers['user-agent'] };
  const result = await authService.register(req.body, meta);
  return R.created(res, result);
}

// POST /api/v1/auth/login
async function login(req, res) {
  const meta   = { ip: req.ip, userAgent: req.headers['user-agent'] };
  const result = await authService.login(req.body, meta);
  return R.success(res, result);
}

// POST /api/v1/auth/refresh
async function refresh(req, res) {
  const { refreshToken } = req.body;
  const result = await authService.refresh(refreshToken);
  return R.success(res, result);
}

// POST /api/v1/auth/change-password  (authenticated)
async function changePassword(req, res) {
  const meta = { ip: req.ip, userAgent: req.headers['user-agent'] };
  await authService.changePassword(req.user.id, req.body, meta);
  return R.success(res, { message: 'Password updated successfully.' });
}

// GET /api/v1/auth/me  (authenticated)
async function getMe(req, res) {
  const user = await authService.getProfile(req.user.id);
  return R.success(res, { user });
}

// PATCH /api/v1/auth/me  (authenticated)
async function updateMe(req, res) {
  const user = await authService.updateProfile(req.user.id, req.body);
  return R.success(res, { user });
}

// POST /api/v1/auth/logout  (authenticated — client discards tokens)
async function logout(req, res) {
  // Stateless JWT — just acknowledge. Implement token blocklist if needed.
  return R.success(res, { message: 'Logged out successfully.' });
}

module.exports = { register, login, refresh, changePassword, getMe, updateMe, logout };