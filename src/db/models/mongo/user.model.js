'use strict';

const mongoose = require('mongoose');
const bcrypt   = require('bcryptjs');
const config   = require('../../../config');

const userSchema = new mongoose.Schema(
  {
    firstName:    { type: String, required: true, trim: true },
    lastName:     { type: String, required: true, trim: true },
    email:        { type: String, required: true, unique: true, lowercase: true, trim: true },
    phone:        { type: String, required: true, unique: true, trim: true },
    passwordHash: { type: String, required: true, select: false },
    pan:          { type: String, uppercase: true, trim: true },
    isVerified:   { type: Boolean, default: false },
    isActive:     { type: Boolean, default: true },
    role:         { type: String, enum: ['borrower', 'admin', 'auditor'], default: 'borrower' },
    lastLoginAt:  { type: Date },
  },
  {
    timestamps: true,    // createdAt, updatedAt auto-managed
    versionKey: false,
  }
);

// Hash password before save
userSchema.pre('save', async function (next) {
  if (!this.isModified('passwordHash')) return next();
  this.passwordHash = await bcrypt.hash(this.passwordHash, config.bcrypt.saltRounds);
  next();
});

// Instance method — compare plain password against hash
userSchema.methods.comparePassword = function (plain) {
  return bcrypt.compare(plain, this.passwordHash);
};

// Virtual — full name
userSchema.virtual('fullName').get(function () {
  return `${this.firstName} ${this.lastName}`;
});

module.exports = mongoose.model('User', userSchema);