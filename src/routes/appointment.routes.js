const { Router } = require('express');
const appointmentController = require('../controllers/appointment.controller');
const validate = require('../middlewares/validate.middleware');
const {
  bookAppointmentSchema,
  updateStatusSchema,
  queryAppointmentsSchema,
  appointmentIdParamSchema
} = require('../validators/appointment.validator');

const router = Router();

// POST /api/v1/appointments - Book a new appointment
router.post(
  '/',
  validate(bookAppointmentSchema, 'body'),
  appointmentController.bookAppointment
);

// GET /api/v1/appointments - Search & list appointments with pagination and filters
router.get(
  '/',
  validate(queryAppointmentsSchema, 'query'),
  appointmentController.listAppointments
);

// GET /api/v1/appointments/:id - Get appointment details by ID
router.get(
  '/:id',
  validate(appointmentIdParamSchema, 'params'),
  appointmentController.getAppointmentById
);

// PATCH /api/v1/appointments/:id/status - Update appointment status (with state machine validation)
router.patch(
  '/:id/status',
  validate(appointmentIdParamSchema, 'params'),
  validate(updateStatusSchema, 'body'),
  appointmentController.updateAppointmentStatus
);

// DELETE /api/v1/appointments/:id - Cancel an appointment
router.delete(
  '/:id',
  validate(appointmentIdParamSchema, 'params'),
  appointmentController.cancelAppointment
);

module.exports = router;
