'use strict';

const Joi = require('joi');

const apply = Joi.object({
  loanType: Joi.string()
    .valid('personal', 'business', 'home', 'education')
    .required(),

  amountRupees: Joi.number()
    .integer()
    .min(10000)
    .max(5000000)
    .required()
    .messages({
      'number.min': 'Minimum loan amount is ₹10,000.',
      'number.max': 'Maximum loan amount is ₹50,00,000.',
    }),

  tenureMonths: Joi.number()
    .integer()
    .valid(6, 12, 24, 36, 48, 60)
    .required(),

  purpose: Joi.string().trim().max(255).required(),

  employmentType: Joi.string()
    .valid('salaried', 'self_employed', 'business')
    .required(),

  monthlyIncomeRupees: Joi.number().integer().min(5000).required()
    .messages({ 'number.min': 'Monthly income must be at least ₹5,000.' }),
});

const reject = Joi.object({
  reason: Joi.string().trim().min(10).max(500).required()
    .messages({ 'string.min': 'Please provide a reason (min 10 characters).' }),
});

const listQuery = Joi.object({
  status: Joi.string().valid('pending','under_review','approved','rejected','disbursed','closed','npa'),
  page:   Joi.number().integer().min(1).default(1),
  limit:  Joi.number().integer().min(1).max(100).default(20),
});

module.exports = { apply, reject, listQuery };