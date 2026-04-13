'use strict';

/**
 * Standardised API response envelope.
 * Every endpoint returns the same shape so the frontend
 * can handle success/error uniformly.
 *
 * Success:  { success: true,  data: {...},  message: "..." }
 * Error:    { success: false, error: "...", code: "ERR_CODE" }
 */

function success(res, data = {}, message = 'OK', statusCode = 200) {
  return res.status(statusCode).json({
    success: true,
    message,
    data,
  });
}

function created(res, data = {}, message = 'Created') {
  return success(res, data, message, 201);
}

function paginated(res, data, pagination) {
  return res.status(200).json({
    success: true,
    data,
    pagination: {
      page:       pagination.page,
      limit:      pagination.limit,
      total:      pagination.total,
      totalPages: Math.ceil(pagination.total / pagination.limit),
    },
  });
}

function error(res, message = 'Something went wrong', statusCode = 500, code = 'SERVER_ERROR') {
  return res.status(statusCode).json({
    success: false,
    error:   message,
    code,
  });
}

function notFound(res, message = 'Resource not found') {
  return error(res, message, 404, 'NOT_FOUND');
}

function badRequest(res, message = 'Bad request') {
  return error(res, message, 400, 'BAD_REQUEST');
}

function unauthorized(res, message = 'Unauthorized') {
  return error(res, message, 401, 'UNAUTHORIZED');
}

function forbidden(res, message = 'Forbidden') {
  return error(res, message, 403, 'FORBIDDEN');
}

function conflict(res, message = 'Conflict') {
  return error(res, message, 409, 'CONFLICT');
}

module.exports = {
  success, created, paginated,
  error, notFound, badRequest, unauthorized, forbidden, conflict,
};