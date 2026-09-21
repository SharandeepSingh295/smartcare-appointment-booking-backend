const Joi = require('joi');

const dateRegex = /^\d{4}-\d{2}-\d{2}$/;
const timeRegex = /^([01]\d|2[0-3]):([0-5]\d)$/;

const bookAppointmentSchema = Joi.object({
  doctorId: Joi.string().trim().required().messages({
    'string.empty': 'Doctor ID is required',
    'any.required': 'Doctor ID is required'
  }),
  patientName: Joi.string().trim().min(2).max(100).required().messages({
    'string.empty': 'Patient name is required',
    'string.min': 'Patient name must be at least 2 characters',
    'any.required': 'Patient name is required'
  }),
  patientEmail: Joi.string().trim().email().required().messages({
    'string.email': 'A valid patient email address is required',
    'any.required': 'Patient email is required'
  }),
  patientPhone: Joi.string().trim().pattern(/^[\d\s+\-()]{7,20}$/).required().messages({
    'string.pattern.base': 'Please provide a valid phone number (7-20 digits)',
    'any.required': 'Patient phone number is required'
  }),
  patientAddress: Joi.string().trim().max(255).allow('', null).default('New Delhi, India').optional(),
  appointmentDate: Joi.string().pattern(dateRegex).required().messages({
    'string.pattern.base': 'appointmentDate must be in YYYY-MM-DD format',
    'any.required': 'Appointment date is required'
  }),
  startTime: Joi.string().pattern(timeRegex).required().messages({
    'string.pattern.base': 'startTime must be in 24-hour HH:mm format (e.g. 09:30)',
    'any.required': 'Start time is required'
  }),
  endTime: Joi.string().pattern(timeRegex).required().messages({
    'string.pattern.base': 'endTime must be in 24-hour HH:mm format (e.g. 10:00)',
    'any.required': 'End time is required'
  }),
  reason: Joi.string().trim().min(3).max(255).required().messages({
    'string.empty': 'Consultation reason is required',
    'string.min': 'Reason must be at least 3 characters',
    'any.required': 'Consultation reason is required'
  }),
  notes: Joi.string().trim().max(500).allow('', null).optional()
});

const updateStatusSchema = Joi.object({
  status: Joi.string().valid('PENDING', 'CONFIRMED', 'CANCELLED', 'COMPLETED').required().messages({
    'any.only': 'Status must be one of: PENDING, CONFIRMED, CANCELLED, COMPLETED',
    'any.required': 'New status is required'
  }),
  notes: Joi.string().trim().max(500).allow('', null).optional()
});

const queryAppointmentsSchema = Joi.object({
  doctorId: Joi.string().trim().optional(),
  status: Joi.string().valid('PENDING', 'CONFIRMED', 'CANCELLED', 'COMPLETED').optional(),
  date: Joi.string().pattern(dateRegex).optional().messages({
    'string.pattern.base': 'date filter must be in YYYY-MM-DD format'
  }),
  patientEmail: Joi.string().trim().email().optional(),
  page: Joi.number().integer().min(1).default(1),
  limit: Joi.number().integer().min(1).max(100).default(10)
});

const appointmentIdParamSchema = Joi.object({
  id: Joi.string().trim().required().messages({
    'string.empty': 'Appointment ID is required',
    'any.required': 'Appointment ID is required'
  })
});

const doctorAvailableSlotsQuerySchema = Joi.object({
  date: Joi.string().pattern(dateRegex).required().messages({
    'string.pattern.base': 'Date parameter must be in YYYY-MM-DD format',
    'any.required': 'Date query parameter is required (e.g., ?date=YYYY-MM-DD)'
  })
});

module.exports = {
  bookAppointmentSchema,
  updateStatusSchema,
  queryAppointmentsSchema,
  appointmentIdParamSchema,
  doctorAvailableSlotsQuerySchema
};
