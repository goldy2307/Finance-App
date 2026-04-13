'use strict';

const jwt      = require('jsonwebtoken');
const config   = require('../config');
const userRepo = require('../db/repositories/user.repo');
const logger   = require('../utils/logger');

class AuthService {

  /** Register a new user */
  async register({ firstName, lastName, email, phone, password, pan }) {
    const [emailTaken, phoneTaken] = await Promise.all([
      userRepo.existsByEmail(email),
      userRepo.existsByPhone(phone),
    ]);
    if (emailTaken) throw Object.assign(new Error('Email already registered'), { status: 409, code: 'EMAIL_EXISTS' });
    if (phoneTaken) throw Object.assign(new Error('Phone already registered'), { status: 409, code: 'PHONE_EXISTS' });

    const user = await userRepo.create({
      firstName,
      lastName,
      email,
      phone,
      passwordHash: password,  // model pre-save hook hashes it
      pan,
    });

    logger.info(`[Auth] New user registered: ${user._id}`);
    return this._buildTokenPair(user);
  }

  /** Login with email or phone + password */
  async login({ identifier, password }) {
    // Detect if identifier is email or phone
    const isEmail = identifier.includes('@');
    const user    = isEmail
      ? await userRepo.findByEmailWithPassword(identifier)
      : await userRepo.findByPhoneWithPassword(identifier);

    if (!user) throw Object.assign(new Error('Invalid credentials'), { status: 401, code: 'INVALID_CREDENTIALS' });
    if (!user.isActive) throw Object.assign(new Error('Account is deactivated'), { status: 403, code: 'ACCOUNT_INACTIVE' });

    const valid = await user.comparePassword(password);
    if (!valid) throw Object.assign(new Error('Invalid credentials'), { status: 401, code: 'INVALID_CREDENTIALS' });

    await userRepo.setLastLogin(user._id);
    logger.info(`[Auth] User logged in: ${user._id}`);
    return this._buildTokenPair(user);
  }

  /** Refresh access token using refresh token */
  async refresh(refreshToken) {
    let payload;
    try {
      payload = jwt.verify(refreshToken, config.jwt.refreshSecret);
    } catch {
      throw Object.assign(new Error('Invalid or expired refresh token'), { status: 401, code: 'INVALID_REFRESH_TOKEN' });
    }

    const user = await userRepo.findById(payload.userId);
    if (!user || !user.isActive) {
      throw Object.assign(new Error('User not found'), { status: 401, code: 'USER_NOT_FOUND' });
    }

    return { accessToken: this._signAccess(user) };
  }

  /** Build access + refresh token pair */
  _buildTokenPair(user) {
    const safeUser = {
      _id:       user._id,
      firstName: user.firstName,
      lastName:  user.lastName,
      email:     user.email,
      phone:     user.phone,
      role:      user.role,
    };
    return {
      accessToken:  this._signAccess(user),
      refreshToken: this._signRefresh(user),
      user:         safeUser,
    };
  }

  _signAccess(user) {
    return jwt.sign(
      { userId: user._id, role: user.role },
      config.jwt.secret,
      { expiresIn: config.jwt.expiresIn }
    );
  }

  _signRefresh(user) {
    return jwt.sign(
      { userId: user._id },
      config.jwt.refreshSecret,
      { expiresIn: config.jwt.refreshExpiresIn }
    );
  }
}

module.exports = new AuthService();