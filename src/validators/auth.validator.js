'use strict';

const Joi = require('joi');

const password = Joi.string()
  .min(8)
  .max(128)
  .pattern(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/)
  .messages({
    'string.pattern.base': 'Password must contain at least one uppercase, one lowercase, and one number.',
    'string.min':          'Password must be at least 8 characters.',
  });

const phone = Joi.string()
  .pattern(/^[6-9]\d{9}$/)
  .messages({ 'string.pattern.base': 'Enter a valid 10-digit Indian mobile number.' });

const register = Joi.object({
  firstName: Joi.string().trim().min(2).max(80).required(),
  lastName:  Joi.string().trim().min(2).max(80).required(),
  email:     Joi.string().email().lowercase().required(),
  phone:     phone.required(),
  password:  password.required(),
});

const login = Joi.object({
  identifier: Joi.alternatives()
    .try(Joi.string().email(), phone)
    .required()
    .messages({ 'alternatives.match': 'Enter a valid email or mobile number.' }),
  password: Joi.string().required(),
});

const refreshToken = Joi.object({
  refreshToken: Joi.string().required(),
});

const changePassword = Joi.object({
  currentPassword: Joi.string().required(),
  newPassword:     password.required(),
});

const updateProfile = Joi.object({
  firstName:   Joi.string().trim().min(2).max(80),
  lastName:    Joi.string().trim().min(2).max(80),
  dateOfBirth: Joi.date().max('now').iso(),
  gender:      Joi.string().valid('male', 'female', 'other', 'prefer_not_to_say'),
  pincode:     Joi.string().pattern(/^\d{6}$/).messages({ 'string.pattern.base': 'Enter a valid 6-digit pincode.' }),
});

module.exports = { register, login, refreshToken, changePassword, updateProfile };