const appointmentService = require('../services/appointment.service');
const ApiResponse = require('../utils/apiResponse');

class AppointmentController {
  bookAppointment(req, res, next) {
    try {
      const appointment = appointmentService.bookAppointment(req.body);
      return ApiResponse.success(res, {
        statusCode: 201,
        message: 'Appointment successfully booked',
        data: appointment
      });
    } catch (error) {
      next(error);
    }
  }

  getAppointmentById(req, res, next) {
    try {
      const { id } = req.params;
      const appointment = appointmentService.getAppointmentById(id);
      return ApiResponse.success(res, {
        statusCode: 200,
        message: 'Appointment retrieved successfully',
        data: appointment
      });
    } catch (error) {
      next(error);
    }
  }

  listAppointments(req, res, next) {
    try {
      const { items, total, page, limit, totalPages } = appointmentService.listAppointments(req.query);
      return ApiResponse.success(res, {
        statusCode: 200,
        message: 'Appointments retrieved successfully',
        data: items,
        pagination: {
          total,
          page,
          limit,
          totalPages
        }
      });
    } catch (error) {
      next(error);
    }
  }

  updateAppointmentStatus(req, res, next) {
    try {
      const { id } = req.params;
      const { status, notes } = req.body;
      const updated = appointmentService.updateAppointmentStatus(id, status, notes);

      return ApiResponse.success(res, {
        statusCode: 200,
        message: `Appointment status successfully updated to ${status}`,
        data: updated
      });
    } catch (error) {
      next(error);
    }
  }

  cancelAppointment(req, res, next) {
    try {
      const { id } = req.params;
      const cancelled = appointmentService.cancelAppointment(id);

      return ApiResponse.success(res, {
        statusCode: 200,
        message: 'Appointment successfully cancelled',
        data: cancelled
      });
    } catch (error) {
      next(error);
    }
  }
}

module.exports = new AppointmentController();
