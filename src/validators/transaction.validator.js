'use strict';

const Joi = require('joi');

const paymentMode = Joi.string().valid('neft', 'imps', 'upi', 'nach', 'cash');

const recordEMI = Joi.object({
  amountRupees: Joi.number().positive().precision(2).required()
    .messages({ 'number.positive': 'Amount must be greater than zero.' }),
  paymentMode:  paymentMode.default('upi'),
  referenceId:  Joi.string().trim().max(100),
});

const prepayment = Joi.object({
  amountRupees: Joi.number().positive().precision(2).required(),
  paymentMode:  paymentMode.default('upi'),
  referenceId:  Joi.string().trim().max(100),
});

const listQuery = Joi.object({
  type:   Joi.string().valid('disbursement','emi_payment','prepayment','foreclosure','fee','refund'),
  status: Joi.string().valid('pending','success','failed','reversed'),
  page:   Joi.number().integer().min(1).default(1),
  limit:  Joi.number().integer().min(1).max(100).default(20),
});

module.exports = { recordEMI, prepayment, listQuery };