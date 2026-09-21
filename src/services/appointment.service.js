const appointmentRepository = require('../repositories/appointment.repository');
const doctorRepository = require('../repositories/doctor.repository');
const { NotFoundError, BadRequestError, ConflictError } = require('../utils/apiError');
const { isOverlapping, isDateTimeInPast, isWithinOperatingHours, timeToMinutes } = require('../utils/dateHelper');
const config = require('../config/env');

class AppointmentService {
  bookAppointment(data) {
    const { doctorId, appointmentDate, startTime, endTime } = data;

    // 1. Verify Doctor Exists
    const doctor = doctorRepository.findById(doctorId);
    if (!doctor) {
      throw new NotFoundError(`Doctor with ID '${doctorId}' does not exist`);
    }

    // 2. Validate Start Time < End Time
    if (timeToMinutes(startTime) >= timeToMinutes(endTime)) {
      throw new BadRequestError(`startTime (${startTime}) must be earlier than endTime (${endTime})`);
    }

    // 3. Prevent booking in the past
    if (isDateTimeInPast(appointmentDate, startTime)) {
      throw new BadRequestError(`Cannot schedule appointment in the past (${appointmentDate} at ${startTime})`);
    }

    // 4. Verify slot is within Doctor's operating hours
    const docStart = doctor.availableFrom || config.business.operatingHoursStart;
    const docEnd = doctor.availableTo || config.business.operatingHoursEnd;
    if (!isWithinOperatingHours(startTime, endTime, docStart, docEnd)) {
      throw new BadRequestError(
        `Appointment time (${startTime} - ${endTime}) falls outside doctor's available hours (${docStart} - ${docEnd})`
      );
    }

    // 5. Check for Conflicts / Double Booking
    const existingAppointments = appointmentRepository.findByDoctorAndDate(doctorId, appointmentDate);
    const conflictingApt = existingAppointments.find(apt =>
      isOverlapping(startTime, endTime, apt.startTime, apt.endTime)
    );

    if (conflictingApt) {
      throw new ConflictError(
        `Doctor '${doctor.name}' already has an active appointment from ${conflictingApt.startTime} to ${conflictingApt.endTime} on ${appointmentDate}`
      );
    }

    // 6. Generate Unique ID & Persist
    const id = `apt_${Date.now().toString(36)}_${Math.random().toString(36).substring(2, 6)}`;
    const now = new Date().toISOString();

    const newAppointment = {
      id,
      doctorId,
      patientName: data.patientName,
      patientEmail: data.patientEmail,
      patientPhone: data.patientPhone,
      patientAddress: data.patientAddress || 'New Delhi, India',
      appointmentDate,
      startTime,
      endTime,
      status: 'PENDING',
      reason: data.reason,
      notes: data.notes || null,
      createdAt: now,
      updatedAt: now
    };

    appointmentRepository.create(newAppointment);

    return {
      ...newAppointment,
      doctorName: doctor.name,
      doctorSpecialty: doctor.specialty,
      consultationFee: doctor.consultationFee,
      doctorAddress: doctor.address
    };
  }

  getAppointmentById(id) {
    const appointment = appointmentRepository.findById(id);
    if (!appointment) {
      throw new NotFoundError(`Appointment with ID '${id}' not found`);
    }
    return appointment;
  }

  listAppointments(filters) {
    return appointmentRepository.findAll(filters);
  }

  updateAppointmentStatus(id, newStatus, notes) {
    const currentAppointment = this.getAppointmentById(id);

    // Enforce state-machine transition rules
    const allowedTransitions = {
      PENDING: ['CONFIRMED', 'CANCELLED'],
      CONFIRMED: ['COMPLETED', 'CANCELLED'],
      CANCELLED: [],
      COMPLETED: []
    };

    const currentStatus = currentAppointment.status;

    if (currentStatus === newStatus) {
      throw new BadRequestError(`Appointment is already marked as ${newStatus}`);
    }

    const permitted = allowedTransitions[currentStatus] || [];
    if (!permitted.includes(newStatus)) {
      throw new BadRequestError(
        `Invalid status transition: Cannot transition from '${currentStatus}' to '${newStatus}'. Permitted transitions: [${permitted.join(', ')}]`
      );
    }

    const updated = appointmentRepository.updateStatus(id, newStatus);
    return updated;
  }

  cancelAppointment(id, reason) {
    return this.updateAppointmentStatus(id, 'CANCELLED', reason);
  }
}

module.exports = new AppointmentService();
