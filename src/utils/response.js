'use strict';

/**
 * Unified API response format for every endpoint.
 *
 * Success:  { success: true,  data: <payload>,   meta?: <pagination> }
 * Error:    { success: false, error: { code, message, details? } }
 */

const success = (res, data = null, statusCode = 200, meta = null) => {
  const body = { success: true, data };
  if (meta) body.meta = meta;
  return res.status(statusCode).json(body);
};

const created = (res, data = null) => success(res, data, 201);

const noContent = (res) => res.status(204).send();

const error = (res, message, statusCode = 500, code = 'INTERNAL_ERROR', details = null) => {
  const body = {
    success: false,
    error: { code, message },
  };
  if (details) body.error.details = details;
  return res.status(statusCode).json(body);
};

const badRequest   = (res, message, details = null) =>
  error(res, message, 400, 'BAD_REQUEST', details);

const unauthorized = (res, message = 'Unauthorized') =>
  error(res, message, 401, 'UNAUTHORIZED');

const forbidden    = (res, message = 'Forbidden') =>
  error(res, message, 403, 'FORBIDDEN');

const notFound     = (res, message = 'Resource not found') =>
  error(res, message, 404, 'NOT_FOUND');

const conflict     = (res, message) =>
  error(res, message, 409, 'CONFLICT');

const unprocessable = (res, message, details = null) =>
  error(res, message, 422, 'UNPROCESSABLE', details);

module.exports = {
  success, created, noContent,
  error, badRequest, unauthorized, forbidden, notFound, conflict, unprocessable,
};