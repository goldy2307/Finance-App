'use strict';

/**
 * Date utilities — thin wrappers so the codebase doesn't
 * scatter raw Date manipulation everywhere.
 */

/** Return current UTC date as ISO string (date only: YYYY-MM-DD) */
function todayISO() {
  return new Date().toISOString().split('T')[0];
}

/** Add N months to a date and return new Date */
function addMonths(date, n) {
  const d = new Date(date);
  d.setMonth(d.getMonth() + n);
  return d;
}

/** Add N days to a date and return new Date */
function addDays(date, n) {
  const d = new Date(date);
  d.setDate(d.getDate() + n);
  return d;
}

/** Return true if date a is before date b */
function isBefore(a, b) {
  return new Date(a) < new Date(b);
}

/** Return the number of full days between two dates */
function diffDays(a, b) {
  const msPerDay = 1000 * 60 * 60 * 24;
  return Math.floor((new Date(b) - new Date(a)) / msPerDay);
}

/** Format date as DD-MM-YYYY */
function formatDDMMYYYY(date) {
  const d = new Date(date);
  const dd = String(d.getDate()).padStart(2, '0');
  const mm = String(d.getMonth() + 1).padStart(2, '0');
  return `${dd}-${mm}-${d.getFullYear()}`;
}

module.exports = { todayISO, addMonths, addDays, isBefore, diffDays, formatDDMMYYYY };