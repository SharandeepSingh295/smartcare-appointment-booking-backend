/**
 * Standardized API response builder.
 * Ensures consistent JSON envelope for all API consumers.
 */

class ApiResponse {
  /**
   * Send a successful JSON response
   * @param {object} res Express response object
   * @param {object} options Options { statusCode, message, data, pagination }
   */
  static success(res, { statusCode = 200, message = 'Success', data = null, pagination = null } = {}) {
    const payload = {
      success: true,
      message,
      data
    };

    if (pagination) {
      payload.pagination = pagination;
    }

    return res.status(statusCode).json(payload);
  }

  /**
   * Send an error JSON response
   * @param {object} res Express response object
   * @param {object} options Options { statusCode, message, errors }
   */
  static error(res, { statusCode = 500, message = 'An unexpected error occurred', errors = [] } = {}) {
    const payload = {
      success: false,
      message
    };

    if (errors && errors.length > 0) {
      payload.errors = errors;
    }

    return res.status(statusCode).json(payload);
  }
}

module.exports = ApiResponse;
