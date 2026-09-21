const { ValidationError } = require('../utils/apiError');

/**
 * Higher-order middleware function to validate request payload (body, query, or params) against a Joi schema.
 * @param {import('joi').Schema} schema Joi schema
 * @param {'body' | 'query' | 'params'} target The property on req to validate
 */
function validate(schema, target = 'body') {
  return (req, res, next) => {
    const dataToValidate = req[target];

    const { error, value } = schema.validate(dataToValidate, {
      abortEarly: false, // Collect all validation errors, not just the first
      stripUnknown: true // Remove undeclared properties (prevents parameter pollution)
    });

    if (error) {
      const formattedErrors = error.details.map(detail => ({
        field: detail.path.join('.'),
        message: detail.message.replace(/['"]/g, '')
      }));

      return next(new ValidationError('Invalid request data', formattedErrors));
    }

    // Assign sanitized & cast values back to req
    req[target] = value;
    return next();
  };
}

module.exports = validate;
