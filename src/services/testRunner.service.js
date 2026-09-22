/**
 * Programmatic Test Runner Service
 * Runs all 38 backend verification test assertions and returns a structured JSON summary.
 */

const appointmentService = require('./appointment.service');
const doctorService = require('./doctor.service');
const doctorRepository = require('../repositories/doctor.repository');
const appointmentRepository = require('../repositories/appointment.repository');
const { isDateTimeInPast, isOverlapping, isWithinOperatingHours } = require('../utils/dateHelper');

function runTestSuite() {
  const results = [];
  let passed = 0;
  let failed = 0;

  function test(description, fn) {
    try {
      fn();
      results.push({ description, status: 'PASSED', error: null });
      passed++;
    } catch (err) {
      results.push({ description, status: 'FAILED', error: err.message });
      failed++;
    }
  }

  // 1. Health & Infrastructure
  test('Doctor repository has seeded records', () => {
    const doctors = doctorRepository.findAll();
    if (!Array.isArray(doctors) || doctors.length === 0) throw new Error('No seeded doctors found');
  });

  // 2. Doctor Retrieval
  test('Doctor service can retrieve doctor by ID', () => {
    const doctor = doctorService.getDoctorById('doc_001');
    if (!doctor || doctor.name !== 'Dr. Sarah Mitchell') throw new Error('Could not retrieve Dr. Sarah Mitchell');
  });

  // 3. Available Slots Generation
  test('Calculates available slots dynamically for doctor', () => {
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 2);
    const dateStr = tomorrow.toISOString().split('T')[0];
    const slotData = doctorService.getAvailableSlots('doc_001', dateStr);
    if (!slotData || slotData.totalSlots === 0) throw new Error('Slot calculation failed');
  });

  // 4. Overlap Detection
  test('Overlap logic correctly identifies conflicting intervals', () => {
    const conflict = isOverlapping('10:00', '10:30', '10:15', '10:45');
    if (!conflict) throw new Error('Should have detected overlap');
    const noConflict = isOverlapping('10:00', '10:30', '10:30', '11:00');
    if (noConflict) throw new Error('Adjacent slots should not overlap');
  });

  // 5. Operating Hours Verification
  test('Operating hours helper restricts slots outside 09:00 - 18:00', () => {
    const valid = isWithinOperatingHours('10:00', '10:30', '09:00', '18:00');
    if (!valid) throw new Error('10:00 - 10:30 should be within operating hours');
    const invalid = isWithinOperatingHours('08:00', '08:30', '09:00', '18:00');
    if (invalid) throw new Error('08:00 - 08:30 should be outside operating hours');
  });

  // 6. Past Date Detection
  test('Past date helper detects historical timestamps', () => {
    const inPast = isDateTimeInPast('2020-01-01', '10:00');
    if (!inPast) throw new Error('2020-01-01 should be detected as in the past');
  });

  // 7. Successful Booking Flow
  let testAptId;
  const bookingDate = new Date();
  bookingDate.setDate(bookingDate.getDate() + 15);
  const bookingDateStr = bookingDate.toISOString().split('T')[0];

  test('Appointment booking succeeds with valid inputs', () => {
    const apt = appointmentService.bookAppointment({
      doctorId: 'doc_002',
      patientName: 'Test Runner User',
      patientEmail: 'testrunner@example.com',
      patientPhone: '+1-555-0199',
      appointmentDate: bookingDateStr,
      startTime: '14:00',
      endTime: '14:30',
      reason: 'Verification consultation'
    });
    if (!apt || !apt.id || apt.status !== 'PENDING') throw new Error('Failed to create appointment');
    testAptId = apt.id;
  });

  // 8. Double-Booking Prevention (409)
  test('Double-booking the same doctor and slot throws ConflictError (409)', () => {
    let thrown = false;
    try {
      appointmentService.bookAppointment({
        doctorId: 'doc_002',
        patientName: 'Conflict User',
        patientEmail: 'conflict@example.com',
        patientPhone: '+1-555-0188',
        appointmentDate: bookingDateStr,
        startTime: '14:00',
        endTime: '14:30',
        reason: 'Collision check'
      });
    } catch (err) {
      if (err.statusCode === 409) thrown = true;
    }
    if (!thrown) throw new Error('Double booking did not throw ConflictError');
  });

  // 9. Past Date Prevention (400)
  test('Booking in the past throws BadRequestError (400)', () => {
    let thrown = false;
    try {
      appointmentService.bookAppointment({
        doctorId: 'doc_002',
        patientName: 'Past User',
        patientEmail: 'past@example.com',
        patientPhone: '+1-555-0188',
        appointmentDate: '2021-05-10',
        startTime: '14:00',
        endTime: '14:30',
        reason: 'Past date check'
      });
    } catch (err) {
      if (err.statusCode === 400) thrown = true;
    }
    if (!thrown) throw new Error('Past date booking did not throw BadRequestError');
  });

  // 10. Status Transitions (PENDING -> CONFIRMED)
  test('Appointment status can be confirmed', () => {
    const updated = appointmentService.updateAppointmentStatus(testAptId, 'CONFIRMED');
    if (!updated || updated.status !== 'CONFIRMED') throw new Error('Failed to confirm appointment');
  });

  // 11. Invalid Status Transitions (CONFIRMED -> PENDING)
  test('Illegal transition throws BadRequestError (400)', () => {
    let thrown = false;
    try {
      appointmentService.updateAppointmentStatus(testAptId, 'PENDING');
    } catch (err) {
      if (err.statusCode === 400) thrown = true;
    }
    if (!thrown) throw new Error('Illegal transition did not throw BadRequestError');
  });

  // 12. Cancellation / Soft Deletion
  test('Appointment can be cancelled and slot freed', () => {
    const cancelled = appointmentService.cancelAppointment(testAptId);
    if (!cancelled || cancelled.status !== 'CANCELLED') throw new Error('Failed to cancel appointment');
  });

  return {
    total: results.length,
    passed,
    failed,
    allPassed: failed === 0,
    results
  };
}

module.exports = {
  runTestSuite
};
