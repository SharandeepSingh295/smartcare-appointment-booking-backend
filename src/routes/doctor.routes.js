const { Router } = require('express');
const doctorController = require('../controllers/doctor.controller');
const validate = require('../middlewares/validate.middleware');
const { createDoctorSchema } = require('../validators/doctor.validator');
const { doctorAvailableSlotsQuerySchema } = require('../validators/appointment.validator');

const router = Router();

// GET /api/v1/doctors - List all registered doctors
router.get('/', doctorController.getAllDoctors);

// POST /api/v1/doctors - Register a new doctor
router.post('/', validate(createDoctorSchema, 'body'), doctorController.createDoctor);

// GET /api/v1/doctors/:id/available-slots - Calculate free slots for a doctor on a specific date
router.get('/:id/available-slots', validate(doctorAvailableSlotsQuerySchema, 'query'), doctorController.getAvailableSlots);

// GET /api/v1/doctors/:id - Retrieve single doctor by ID
router.get('/:id', doctorController.getDoctorById);

module.exports = router;
