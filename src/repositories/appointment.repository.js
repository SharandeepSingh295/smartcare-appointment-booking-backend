const db = require('../config/database');

class AppointmentRepository {
  create(appointmentData) {
    return db.insertAppointment(appointmentData);
  }

  findById(id) {
    return db.getAppointmentById(id);
  }

  findByDoctorAndDate(doctorId, appointmentDate) {
    return db.getAppointmentsByDoctorAndDate(doctorId, appointmentDate);
  }

  findAll(filters) {
    return db.findAppointments(filters);
  }

  updateStatus(id, status) {
    return db.updateAppointmentStatus(id, status);
  }

  delete(id) {
    return db.deleteAppointment(id);
  }
}

module.exports = new AppointmentRepository();
