const { NotFoundError } = require('../utils/apiError');

/**
 * 404 Handler for undefined routes.
 */
function notFoundHandler(req, res, next) {
  next(new NotFoundError(`Cannot ${req.method} ${req.originalUrl} - Endpoint does not exist`));
}

module.exports = notFoundHandler;
