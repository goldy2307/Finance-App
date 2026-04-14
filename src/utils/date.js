'use strict';

const dayjs = require('dayjs');
const utc   = require('dayjs/plugin/utc');
dayjs.extend(utc);

/** Current UTC timestamp as Date */
const now = () => dayjs.utc().toDate();

/** Format a date to readable string */
const format = (date, fmt = 'YYYY-MM-DD') => dayjs(date).utc().format(fmt);

/** Add months to a date */
const addMonths = (date, months) => dayjs(date).add(months, 'month').toDate();

/** Difference in days between two dates */
const diffDays = (from, to) => dayjs(to).diff(dayjs(from), 'day');

/** Check if a date is past due */
const isPastDue = (dueDate) => dayjs().isAfter(dayjs(dueDate));

module.exports = { now, format, addMonths, diffDays, isPastDue };