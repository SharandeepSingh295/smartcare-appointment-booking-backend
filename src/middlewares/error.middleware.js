const ApiResponse = require('../utils/apiResponse');
const { AppError } = require('../utils/apiError');
const config = require('../config/env');

/**
 * Global Error-Handling Middleware
 * Intercepts all synchronous and asynchronous errors forwarded via next(err).
 */
function errorHandler(err, req, res, next) {
  let statusCode = 500;
  let message = 'Internal Server Error';
  let errors = [];

  if (err instanceof AppError) {
    statusCode = err.statusCode;
    message = err.message;
    errors = err.errors || [];
  } else if (err.type === 'entity.parse.failed') {
    // Malformed JSON payload in request body
    statusCode = 400;
    message = 'Malformed JSON in request body';
  } else {
    // Unexpected programmer error or unhandled exception
    console.error('[Unhandled Error]', err);
    if (config.nodeEnv === 'development') {
      message = err.message || 'Internal Server Error';
    }
  }

  return ApiResponse.error(res, {
    statusCode,
    message,
    errors
  });
}

module.exports = errorHandler;
