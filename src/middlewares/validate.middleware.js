'use strict';

const R = require('../utils/response');

/**
 * validate(schema) — Joi validation middleware.
 * Validates req.body against the provided Joi schema.
 * Strips unknown keys (allowUnknown: false).
 *
 * Usage:
 *   router.post('/loans', authenticate, validate(loanSchemas.apply), loanController.apply)
 */
function validate(schema) {
  return (req, res, next) => {
    const { error, value } = schema.validate(req.body, {
      abortEarly:   false,   // collect ALL errors, not just the first
      stripUnknown: true,    // remove keys not in schema
      convert:      true,    // coerce strings to numbers where expected
    });

    if (error) {
      const details = error.details.map((d) => ({
        field:   d.path.join('.'),
        message: d.message.replace(/['"]/g, ''),
      }));
      return R.badRequest(res, 'Validation failed.', details);
    }

    req.body = value; // use the sanitised value
    next();
  };
}

/**
 * validateQuery(schema) — same but validates req.query.
 */
function validateQuery(schema) {
  return (req, res, next) => {
    const { error, value } = schema.validate(req.query, {
      abortEarly:   false,
      stripUnknown: true,
      convert:      true,
    });

    if (error) {
      const details = error.details.map((d) => ({
        field:   d.path.join('.'),
        message: d.message.replace(/['"]/g, ''),
      }));
      return R.badRequest(res, 'Invalid query parameters.', details);
    }

    req.query = value;
    next();
  };
}

module.exports = { validate, validateQuery };