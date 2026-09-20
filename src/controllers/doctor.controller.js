const doctorService = require('../services/doctor.service');
const ApiResponse = require('../utils/apiResponse');

class DoctorController {
  getAllDoctors(req, res, next) {
    try {
      const doctors = doctorService.getAllDoctors();
      return ApiResponse.success(res, {
        statusCode: 200,
        message: 'Doctors retrieved successfully',
        data: doctors
      });
    } catch (error) {
      next(error);
    }
  }

  getDoctorById(req, res, next) {
    try {
      const { id } = req.params;
      const doctor = doctorService.getDoctorById(id);
      return ApiResponse.success(res, {
        statusCode: 200,
        message: 'Doctor details retrieved successfully',
        data: doctor
      });
    } catch (error) {
      next(error);
    }
  }

  createDoctor(req, res, next) {
    try {
      const newDoctor = doctorService.createDoctor(req.body);
      return ApiResponse.success(res, {
        statusCode: 201,
        message: 'Doctor registered successfully',
        data: newDoctor
      });
    } catch (error) {
      next(error);
    }
  }

  getAvailableSlots(req, res, next) {
    try {
      const { id } = req.params;
      const { date } = req.query;
      const slotData = doctorService.getAvailableSlots(id, date);

      return ApiResponse.success(res, {
        statusCode: 200,
        message: `Available slots for ${date} retrieved successfully`,
        data: slotData
      });
    } catch (error) {
      next(error);
    }
  }
}

module.exports = new DoctorController();
