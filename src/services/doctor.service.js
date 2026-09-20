const doctorRepository = require('../repositories/doctor.repository');
const appointmentRepository = require('../repositories/appointment.repository');
const { NotFoundError, ConflictError, BadRequestError } = require('../utils/apiError');
const { generateTimeSlots, isOverlapping, isDateTimeInPast } = require('../utils/dateHelper');
const config = require('../config/env');

class DoctorService {
  getAllDoctors() {
    return doctorRepository.findAll();
  }

  getDoctorById(id) {
    const doctor = doctorRepository.findById(id);
    if (!doctor) {
      throw new NotFoundError(`Doctor with ID '${id}' not found`);
    }
    return doctor;
  }

  createDoctor(doctorData) {
    // Check if email already registered
    const existing = doctorRepository.findByEmail(doctorData.email);
    if (existing) {
      throw new ConflictError(`Doctor with email '${doctorData.email}' is already registered`);
    }

    const id = `doc_${Date.now().toString(36)}_${Math.random().toString(36).substring(2, 6)}`;
    const newDoctor = {
      id,
      ...doctorData,
      createdAt: new Date().toISOString()
    };

    return doctorRepository.create(newDoctor);
  }

  getAvailableSlots(doctorId, date) {
    const doctor = this.getDoctorById(doctorId);

    // Generate base discrete time slots based on doctor's availability
    const fromTime = doctor.availableFrom || config.business.operatingHoursStart;
    const toTime = doctor.availableTo || config.business.operatingHoursEnd;
    const allSlots = generateTimeSlots(fromTime, toTime, config.business.slotDurationMinutes);

    // Fetch existing appointments for this doctor on the requested date
    const bookedAppointments = appointmentRepository.findByDoctorAndDate(doctorId, date);

    // Map through slots and calculate availability
    const slotsWithAvailability = allSlots.map(slot => {
      // 1. Check if the slot is in the past
      const isPast = isDateTimeInPast(date, slot.startTime);
      if (isPast) {
        return {
          ...slot,
          isAvailable: false,
          reason: 'Slot is in the past'
        };
      }

      // 2. Check if overlapping with any existing active appointment
      const conflict = bookedAppointments.find(apt =>
        isOverlapping(slot.startTime, slot.endTime, apt.startTime, apt.endTime)
      );

      if (conflict) {
        return {
          ...slot,
          isAvailable: false,
          reason: 'Slot already booked'
        };
      }

      return {
        ...slot,
        isAvailable: true,
        reason: null
      };
    });

    return {
      doctor: {
        id: doctor.id,
        name: doctor.name,
        specialty: doctor.specialty,
        consultationFee: doctor.consultationFee,
        address: doctor.address
      },
      date,
      totalSlots: slotsWithAvailability.length,
      availableSlotsCount: slotsWithAvailability.filter(s => s.isAvailable).length,
      slots: slotsWithAvailability
    };
  }
}

module.exports = new DoctorService();
