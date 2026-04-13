'use strict';

/**
 * Currency utilities — all arithmetic uses integer paise (×100)
 * to avoid IEEE-754 floating point rounding errors on money.
 *
 * Rule: NEVER do  rupees * 0.105  directly.
 *       ALWAYS convert to paise, operate, convert back.
 */

const PAISE_FACTOR = 100;

/** Convert rupees (float) → paise (integer) */
function toPaise(rupees) {
  return Math.round(parseFloat(rupees) * PAISE_FACTOR);
}

/** Convert paise (integer) → rupees (float, 2 dp) */
function toRupees(paise) {
  return parseFloat((paise / PAISE_FACTOR).toFixed(2));
}

/** Add two rupee amounts safely */
function add(a, b) {
  return toRupees(toPaise(a) + toPaise(b));
}

/** Subtract b from a safely */
function subtract(a, b) {
  return toRupees(toPaise(a) - toPaise(b));
}

/** Multiply a rupee amount by a scalar (e.g. interest rate) */
function multiply(rupees, scalar) {
  return toRupees(Math.round(toPaise(rupees) * scalar));
}

/**
 * Calculate EMI using standard reducing-balance formula.
 * @param {number} principal  - Loan amount in rupees
 * @param {number} annualRate - Annual interest rate in % (e.g. 10.5)
 * @param {number} months     - Tenure in months
 * @returns {number}          - Monthly EMI in rupees (rounded to 2 dp)
 */
function calcEMI(principal, annualRate, months) {
  if (annualRate === 0) return toRupees(toPaise(principal) / months);
  const r   = annualRate / 12 / 100;
  const pow = Math.pow(1 + r, months);
  const emi = (principal * r * pow) / (pow - 1);
  return parseFloat(emi.toFixed(2));
}

/**
 * Format rupees as Indian locale string.
 * e.g. 500000 → "₹5,00,000.00"
 */
function formatINR(amount) {
  return '₹' + parseFloat(amount).toLocaleString('en-IN', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
}

module.exports = { toPaise, toRupees, add, subtract, multiply, calcEMI, formatINR };