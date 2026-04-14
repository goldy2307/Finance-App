'use strict';

const mongoose = require('mongoose');
const bcrypt   = require('bcryptjs');
const config   = require('../../../config');

const userSchema = new mongoose.Schema(
  {
    firstName:  { type: String, required: true, trim: true },
    lastName:   { type: String, required: true, trim: true },
    email:      { type: String, required: true, unique: true, lowercase: true, trim: true },
    phone:      { type: String, required: true, unique: true, trim: true },
    password:   { type: String, required: true, minlength: 8, select: false },
    pan:        { type: String, trim: true, uppercase: true },
    dateOfBirth:{ type: Date },
    gender:     { type: String, enum: ['male', 'female', 'other', 'prefer_not_to_say'] },
    pincode:    { type: String, trim: true },

    role: {
      type:    String,
      enum:    ['borrower', 'admin', 'agent'],
      default: 'borrower',
    },

    isVerified:    { type: Boolean, default: false },
    isActive:      { type: Boolean, default: true  },
    lastLoginAt:   { type: Date },

    refreshTokens: [{ type: String, select: false }],
  },
  {
    timestamps: true,        // createdAt, updatedAt
    versionKey: false,
  }
);

// ── Hash password before save ─────────────────────────────────────────────
userSchema.pre('save', async function (next) {
  if (!this.isModified('password')) return next();
  this.password = await bcrypt.hash(this.password, config.bcrypt.rounds);
  next();
});

// ── Instance method: compare password ────────────────────────────────────
userSchema.methods.comparePassword = async function (plain) {
  return bcrypt.compare(plain, this.password);
};

// ── Virtual: full name ────────────────────────────────────────────────────
userSchema.virtual('fullName').get(function () {
  return `${this.firstName} ${this.lastName}`;
});

// ── Remove sensitive fields from JSON output ──────────────────────────────
userSchema.set('toJSON', {
  virtuals: true,
  transform(_, ret) {
    delete ret.password;
    delete ret.refreshTokens;
    delete ret.__v;
    return ret;
  },
});

userSchema.index({ email: 1 });
userSchema.index({ phone: 1 });

module.exports = mongoose.model('User', userSchema);