const db = require('../config/database');

class DoctorRepository {
  findAll() {
    return db.allDoctors();
  }

  findById(id) {
    return db.getDoctorById(id);
  }

  findByEmail(email) {
    return db.getDoctorByEmail(email);
  }

  create(doctorData) {
    return db.insertDoctor(doctorData);
  }
}

module.exports = new DoctorRepository();
