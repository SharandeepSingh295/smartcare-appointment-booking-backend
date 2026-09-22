/**
 * Automated Test Runner for SmartCare Backend System
 * Tests all key scenarios: happy path, validation errors, conflict detection,
 * state machine transitions, slot availability, and 404 handling.
 */

const http = require('http');
const app = require('../src/app');

let server;
let baseUrl;

// Test utilities
let passed = 0;
let failed = 0;

function assert(condition, message) {
  if (!condition) {
    console.error(`  ❌ FAILED: ${message}`);
    failed++;
    throw new Error(message);
  } else {
    console.log(`  ✅ PASSED: ${message}`);
    passed++;
  }
}

async function request(method, path, body = null) {
  const url = `${baseUrl}${path}`;
  const options = {
    method,
    headers: {
      'Content-Type': 'application/json'
    }
  };

  if (body) {
    options.body = JSON.stringify(body);
  }

  const res = await fetch(url, options);
  const data = await res.json();
  return { status: res.status, data };
}

// Compute future date string YYYY-MM-DD
function getFutureDate(daysAhead = 7) {
  const d = new Date();
  d.setDate(d.getDate() + daysAhead);
  return d.toISOString().split('T')[0];
}

async function runAllTests() {
  console.log('\n======================================================');
  console.log('🧪 Starting SmartCare Backend Automated Test Suite');
  console.log('======================================================\n');

  // Start temporary test server on ephemeral port
  await new Promise((resolve) => {
    server = app.listen(0, () => {
      const port = server.address().port;
      baseUrl = `http://localhost:${port}`;
      resolve();
    });
  });

  try {
    // -----------------------------------------------------------
    // TEST 1: Health Check Endpoint
    // -----------------------------------------------------------
    console.log('[Suite 1: System Health & Infrastructure]');
    {
      const res = await request('GET', '/api/v1/health');
      assert(res.status === 200, 'GET /api/v1/health returns 200 OK');
      assert(res.data.success === true, 'Response has success: true');
      assert(res.data.data.status === 'UP', 'Service status is UP');
    }

    // -----------------------------------------------------------
    // TEST 2: List Doctors
    // -----------------------------------------------------------
    console.log('\n[Suite 2: Doctor Management]');
    let doctorId;
    {
      const res = await request('GET', '/api/v1/doctors');
      assert(res.status === 200, 'GET /api/v1/doctors returns 200 OK');
      assert(Array.isArray(res.data.data), 'Doctors list is an array');
      assert(res.data.data.length > 0, 'At least one seeded doctor exists');
      doctorId = res.data.data[0].id;
    }

    // -----------------------------------------------------------
    // TEST 3: Validation Error on Missing Fields
    // -----------------------------------------------------------
    console.log('\n[Suite 3: Input Validation & Sanitization]');
    {
      const res = await request('POST', '/api/v1/appointments', {
        // Missing required fields like doctorId, patientEmail, etc.
        patientName: 'Aman Verma'
      });
      assert(res.status === 400, 'Missing fields returns 400 Bad Request');
      assert(res.data.success === false, 'Error response has success: false');
      assert(Array.isArray(res.data.errors), 'Validation errors array is provided');
      assert(res.data.errors.length > 0, 'Contains specific field error descriptions');
    }

    // -----------------------------------------------------------
    // TEST 4: Validation Error on Invalid Email Format
    // -----------------------------------------------------------
    {
      const futureDate = getFutureDate(5);
      const res = await request('POST', '/api/v1/appointments', {
        doctorId,
        patientName: 'Pooja Sharma',
        patientEmail: 'not-an-email',
        patientPhone: '+91 98765 43210',
        patientAddress: 'Connaught Place, New Delhi',
        appointmentDate: futureDate,
        startTime: '10:00',
        endTime: '10:30',
        reason: 'Routine checkup'
      });
      assert(res.status === 400, 'Invalid email format returns 400 Bad Request');
      assert(res.data.errors.some(e => e.field === 'patientEmail'), 'Error specifically flags patientEmail');
    }

    // -----------------------------------------------------------
    // TEST 5: Business Rule - Reject Past Date Appointment
    // -----------------------------------------------------------
    console.log('\n[Suite 4: Business Rules & Logic Verification]');
    {
      const res = await request('POST', '/api/v1/appointments', {
        doctorId,
        patientName: 'Pooja Sharma',
        patientEmail: 'pooja.sharma@example.in',
        patientPhone: '+91 98765 43210',
        patientAddress: 'Connaught Place, New Delhi',
        appointmentDate: '2020-01-01', // Date in the past
        startTime: '10:00',
        endTime: '10:30',
        reason: 'Routine checkup'
      });
      assert(res.status === 400, 'Past date appointment is rejected with 400 Bad Request');
      assert(res.data.message.includes('past'), 'Error message informs user about past date');
    }

    // -----------------------------------------------------------
    // TEST 6: Successful Appointment Booking (Happy Path)
    // -----------------------------------------------------------
    const testDate = getFutureDate(10);
    let createdAppointmentId;
    {
      const res = await request('POST', '/api/v1/appointments', {
        doctorId,
        patientName: 'Aarav Sharma',
        patientEmail: 'aarav.sharma@example.in',
        patientPhone: '+91 98201 11223',
        patientAddress: 'Rohini Sector 14, New Delhi',
        appointmentDate: testDate,
        startTime: '11:00',
        endTime: '11:30',
        reason: 'Cardiology Consultation',
        notes: 'First time consultation'
      });
      assert(res.status === 201, 'Booking appointment returns 201 Created');
      assert(res.data.success === true, 'Success flag is true');
      assert(res.data.data.id.startsWith('apt_'), 'Appointment has unique ID');
      assert(res.data.data.status === 'PENDING', 'Default initial status is PENDING');
      assert(res.data.data.doctorName !== undefined, 'Includes doctor details in response');
      createdAppointmentId = res.data.data.id;
    }

    // -----------------------------------------------------------
    // TEST 7: Conflict Detection - Double Booking Prevention
    // -----------------------------------------------------------
    {
      // Attempt to book overlapping time with same doctor on same date
      const res = await request('POST', '/api/v1/appointments', {
        doctorId,
        patientName: 'Rohan Verma',
        patientEmail: 'rohan.verma@example.in',
        patientPhone: '+91 98111 22334',
        patientAddress: 'Worli Sea Face, Mumbai',
        appointmentDate: testDate,
        startTime: '11:15', // Overlaps with 11:00 - 11:30!
        endTime: '11:45',
        reason: 'Second consultation'
      });
      assert(res.status === 409, 'Overlapping appointment booking returns 409 Conflict');
      assert(res.data.success === false, 'Success is false');
      assert(res.data.message.includes('already has an active appointment'), 'Detailed conflict reason provided');
    }

    // -----------------------------------------------------------
    // TEST 8: Available Slots Calculation
    // -----------------------------------------------------------
    console.log('\n[Suite 5: Dynamic Slot Availability]');
    {
      const res = await request('GET', `/api/v1/doctors/${doctorId}/available-slots?date=${testDate}`);
      assert(res.status === 200, 'GET available-slots returns 200 OK');
      assert(Array.isArray(res.data.data.slots), 'Slots array is returned');
      const bookedSlot = res.data.data.slots.find(s => s.startTime === '11:00');
      assert(bookedSlot !== undefined, 'Booked slot exists in calculation');
      assert(bookedSlot.isAvailable === false, 'Slot 11:00 is marked as isAvailable: false');
      assert(bookedSlot.reason === 'Slot already booked', 'Reason accurately states Slot already booked');
    }

    // -----------------------------------------------------------
    // TEST 9: Get Single Appointment by ID
    // -----------------------------------------------------------
    console.log('\n[Suite 6: Retrieval & Pagination]');
    {
      const res = await request('GET', `/api/v1/appointments/${createdAppointmentId}`);
      assert(res.status === 200, 'GET /appointments/:id returns 200 OK');
      assert(res.data.data.id === createdAppointmentId, 'Returns the exact appointment record');
    }

    // -----------------------------------------------------------
    // TEST 10: Non-existent Resource 404
    // -----------------------------------------------------------
    {
      const res = await request('GET', '/api/v1/appointments/apt_non_existent_id');
      assert(res.status === 404, 'Non-existent ID returns 404 Not Found');
    }

    // -----------------------------------------------------------
    // TEST 11: State Machine Transition (PENDING -> CONFIRMED)
    // -----------------------------------------------------------
    console.log('\n[Suite 7: State-Machine Transitions]');
    {
      const res = await request('PATCH', `/api/v1/appointments/${createdAppointmentId}/status`, {
        status: 'CONFIRMED'
      });
      assert(res.status === 200, 'Updating status to CONFIRMED returns 200 OK');
      assert(res.data.data.status === 'CONFIRMED', 'Status changed to CONFIRMED');
    }

    // -----------------------------------------------------------
    // TEST 12: Invalid State Machine Transition (CONFIRMED -> PENDING)
    // -----------------------------------------------------------
    {
      const res = await request('PATCH', `/api/v1/appointments/${createdAppointmentId}/status`, {
        status: 'PENDING'
      });
      assert(res.status === 400, 'Invalid transition (CONFIRMED -> PENDING) is rejected with 400 Bad Request');
      assert(res.data.message.includes('Invalid status transition'), 'Clear explanation of invalid transition');
    }

    // -----------------------------------------------------------
    // TEST 13: Cancellation / Deletion
    // -----------------------------------------------------------
    {
      const res = await request('DELETE', `/api/v1/appointments/${createdAppointmentId}`);
      assert(res.status === 200, 'DELETE /appointments/:id returns 200 OK');
      assert(res.data.data.status === 'CANCELLED', 'Appointment status is marked CANCELLED');
    }

    // -----------------------------------------------------------
    // TEST 14: Slot is freed up after Cancellation
    // -----------------------------------------------------------
    {
      const res = await request('GET', `/api/v1/doctors/${doctorId}/available-slots?date=${testDate}`);
      const slot = res.data.data.slots.find(s => s.startTime === '11:00');
      assert(slot.isAvailable === true, 'Cancelled slot is now free and available again');
    }

    // -----------------------------------------------------------
    // TEST 15: 404 on Unknown Endpoint
    // -----------------------------------------------------------
    console.log('\n[Suite 8: Unmatched Route Handling]');
    {
      const res = await request('GET', '/api/v1/unknown-route-xyz');
      assert(res.status === 404, 'Unknown endpoint returns 404 Not Found');
    }

  } finally {
    await new Promise((resolve) => server.close(resolve));
  }

  console.log('\n======================================================');
  console.log(`📊 Test Results: ${passed} PASSED, ${failed} FAILED`);
  console.log('======================================================\n');

  if (failed > 0) {
    process.exit(1);
  }
}

runAllTests().catch((err) => {
  console.error('Test Suite encountered an error:', err);
  process.exit(1);
});
