'use strict';

/**
 * All money values are stored and computed in PAISE (integer).
 * 1 rupee = 100 paise.  This eliminates floating-point errors.
 *
 * Usage:
 *   const { toPaise, toRupees, add, subtract, multiply, formatINR } = require('./currency');
 */

/** Convert rupees (float) → paise (integer) */
const toPaise = (rupees) => Math.round(Number(rupees) * 100);

/** Convert paise (integer) → rupees (float, 2 dp) */
const toRupees = (paise) => Number((paise / 100).toFixed(2));

/** Add two paise values */
const add = (a, b) => a + b;

/** Subtract paise values */
const subtract = (a, b) => a - b;

/**
 * Multiply paise × decimal rate (e.g. interest rate 0.105)
 * Returns paise (integer)
 */
const multiply = (paise, rate) => Math.round(paise * rate);

/**
 * Calculate EMI in paise
 * @param {number} principalPaise  - Loan principal in paise
 * @param {number} annualRatePct   - Annual interest rate in % (e.g. 10.5)
 * @param {number} tenureMonths    - Tenure in months
 * @returns {number} EMI in paise
 */
const calcEMI = (principalPaise, annualRatePct, tenureMonths) => {
  if (annualRatePct === 0) return Math.round(principalPaise / tenureMonths);
  const r = annualRatePct / 12 / 100;
  const emi =
    (principalPaise * r * Math.pow(1 + r, tenureMonths)) /
    (Math.pow(1 + r, tenureMonths) - 1);
  return Math.round(emi);
};

/**
 * Format paise → Indian locale string  e.g. 500000 → "₹5,000.00"
 */
const formatINR = (paise) =>
  new Intl.NumberFormat('en-IN', {
    style:                 'currency',
    currency:              'INR',
    minimumFractionDigits: 2,
  }).format(paise / 100);

module.exports = { toPaise, toRupees, add, subtract, multiply, calcEMI, formatINR };