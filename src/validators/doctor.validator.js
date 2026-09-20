const Joi = require('joi');

const timeRegex = /^([01]\d|2[0-3]):([0-5]\d)$/;

const createDoctorSchema = Joi.object({
  name: Joi.string().trim().min(3).max(100).required().messages({
    'string.empty': 'Doctor name is required',
    'string.min': 'Doctor name must be at least 3 characters',
    'any.required': 'Doctor name is required'
  }),
  specialty: Joi.string().trim().min(2).max(100).required().messages({
    'string.empty': 'Medical specialty is required',
    'any.required': 'Medical specialty is required'
  }),
  email: Joi.string().trim().email().required().messages({
    'string.email': 'A valid email address is required',
    'any.required': 'Email is required'
  }),
  phone: Joi.string().trim().pattern(/^[\d\s+\-()]{7,20}$/).required().messages({
    'string.pattern.base': 'Please provide a valid phone number (7-20 digits)',
    'any.required': 'Phone number is required'
  }),
  address: Joi.string().trim().min(5).max(255).default('Connaught Place, New Delhi, Delhi 110001').messages({
    'string.min': 'Clinic address must be at least 5 characters'
  }),
  consultationFee: Joi.number().positive().precision(2).required().messages({
    'number.base': 'Consultation fee must be a valid number',
    'number.positive': 'Consultation fee must be greater than zero',
    'any.required': 'Consultation fee is required'
  }),
  availableFrom: Joi.string().pattern(timeRegex).default('09:00').messages({
    'string.pattern.base': 'availableFrom must be in HH:mm format (e.g. 09:00)'
  }),
  availableTo: Joi.string().pattern(timeRegex).default('18:00').messages({
    'string.pattern.base': 'availableTo must be in HH:mm format (e.g. 18:00)'
  })
});

module.exports = {
  createDoctorSchema
};
