const fs = require('fs');
const path = require('path');
const config = require('./env');

class DatabaseManager {
  constructor() {
    this.db = null;
    this.isNativeSqlite = false;
    this.inMemoryData = {
      doctors: [],
      appointments: []
    };
  }

  init() {
    // Ensure data directory exists
    const dataDir = path.dirname(config.dbFilePath);
    if (!fs.existsSync(dataDir)) {
      fs.mkdirSync(dataDir, { recursive: true });
    }

    try {
      const { DatabaseSync } = require('node:sqlite');
      this.db = new DatabaseSync(config.dbFilePath);
      this.isNativeSqlite = true;
      this.initSqliteSchema();
      console.log(`[Database] Connected to SQLite database at: ${config.dbFilePath}`);
    } catch (err) {
      console.warn('[Database] Native SQLite unavailable or failed, falling back to persistent JSON storage:', err.message);
      this.isNativeSqlite = false;
      this.initJsonStorage(config.dbFilePath + '.json');
    }

    this.seedInitialData();
  }

  initSqliteSchema() {
    // Enable foreign keys
    this.db.exec('PRAGMA foreign_keys = ON;');

    // Create doctors table with address
    this.db.exec(`
      CREATE TABLE IF NOT EXISTS doctors (
        id TEXT PRIMARY KEY,
        name TEXT NOT NULL,
        specialty TEXT NOT NULL,
        email TEXT UNIQUE NOT NULL,
        phone TEXT NOT NULL,
        address TEXT NOT NULL,
        consultationFee REAL NOT NULL,
        availableFrom TEXT DEFAULT '09:00',
        availableTo TEXT DEFAULT '18:00',
        createdAt TEXT NOT NULL
      );
    `);

    // Create appointments table with patientAddress
    this.db.exec(`
      CREATE TABLE IF NOT EXISTS appointments (
        id TEXT PRIMARY KEY,
        doctorId TEXT NOT NULL,
        patientName TEXT NOT NULL,
        patientEmail TEXT NOT NULL,
        patientPhone TEXT NOT NULL,
        patientAddress TEXT DEFAULT 'India',
        appointmentDate TEXT NOT NULL,
        startTime TEXT NOT NULL,
        endTime TEXT NOT NULL,
        status TEXT NOT NULL DEFAULT 'PENDING',
        reason TEXT NOT NULL,
        notes TEXT,
        createdAt TEXT NOT NULL,
        updatedAt TEXT NOT NULL,
        FOREIGN KEY (doctorId) REFERENCES doctors (id) ON DELETE RESTRICT
      );
    `);

    // Create indexes for performance
    this.db.exec(`
      CREATE INDEX IF NOT EXISTS idx_appointments_doctor_date ON appointments(doctorId, appointmentDate);
      CREATE INDEX IF NOT EXISTS idx_appointments_status ON appointments(status);
    `);
  }

  initJsonStorage(jsonPath) {
    this.jsonPath = jsonPath;
    if (fs.existsSync(this.jsonPath)) {
      try {
        const raw = fs.readFileSync(this.jsonPath, 'utf8');
        this.inMemoryData = JSON.parse(raw);
      } catch {
        this.inMemoryData = { doctors: [], appointments: [] };
      }
    } else {
      this.saveJson();
    }
  }

  saveJson() {
    if (!this.isNativeSqlite && this.jsonPath) {
      fs.writeFileSync(this.jsonPath, JSON.stringify(this.inMemoryData, null, 2), 'utf8');
    }
  }

  seedInitialData() {
    const existingDoctors = this.allDoctors();
    if (existingDoctors.length === 0) {
      console.log('[Database] Seeding 5 initial doctors with Indian profile data...');
      const seedDoctors = [
        {
          id: 'doc_001',
          name: 'Dr. Rajesh Sharma',
          specialty: 'Cardiology',
          email: 'dr.rajesh.sharma@smartcare.in',
          phone: '+91 98201 23456',
          address: 'AIIMS OPD Block, Sri Aurobindo Marg, New Delhi 110029',
          consultationFee: 800.0,
          availableFrom: '09:00',
          availableTo: '17:00',
          createdAt: new Date().toISOString()
        },
        {
          id: 'doc_002',
          name: 'Dr. Priya Patel',
          specialty: 'Dermatology',
          email: 'dr.priya.patel@smartcare.in',
          phone: '+91 98450 34567',
          address: '14th Cross, 100 Feet Road, Indiranagar, Bengaluru, Karnataka 560038',
          consultationFee: 600.0,
          availableFrom: '10:00',
          availableTo: '18:00',
          createdAt: new Date().toISOString()
        },
        {
          id: 'doc_003',
          name: 'Dr. Amit Verma',
          specialty: 'General Medicine',
          email: 'dr.amit.verma@smartcare.in',
          phone: '+91 98110 45678',
          address: 'Plot C-32, G Block, Bandra Kurla Complex, Mumbai, Maharashtra 400051',
          consultationFee: 500.0,
          availableFrom: '09:00',
          availableTo: '16:00',
          createdAt: new Date().toISOString()
        },
        {
          id: 'doc_004',
          name: 'Dr. Ananya Iyer',
          specialty: 'Pediatrics',
          email: 'dr.ananya.iyer@smartcare.in',
          phone: '+91 98300 56789',
          address: '77 Park Street, Park Circus, Kolkata, West Bengal 700016',
          consultationFee: 700.0,
          availableFrom: '09:30',
          availableTo: '17:30',
          createdAt: new Date().toISOString()
        },
        {
          id: 'doc_005',
          name: 'Dr. Vikram Malhotra',
          specialty: 'Orthopedics',
          email: 'dr.vikram.malhotra@smartcare.in',
          phone: '+91 98710 67890',
          address: 'Sector 18 Market Complex, Near Metro Station, Noida, Uttar Pradesh 201301',
          consultationFee: 750.0,
          availableFrom: '10:00',
          availableTo: '18:00',
          createdAt: new Date().toISOString()
        }
      ];

      for (const doc of seedDoctors) {
        this.insertDoctor(doc);
      }
      console.log(`[Database] Successfully seeded ${seedDoctors.length} doctors.`);
    }

    // Check if appointments are empty, seed 4 sample Indian candidate appointments
    const existingAppointments = this.findAppointments({ limit: 10 });
    if (existingAppointments.total === 0) {
      console.log('[Database] Seeding 4 initial patient appointments...');
      const seedAppointments = [
        {
          id: 'apt_seed_001',
          doctorId: 'doc_001',
          patientName: 'Aarav Sharma',
          patientEmail: 'aarav.sharma@gmail.com',
          patientPhone: '+91 98765 11223',
          patientAddress: 'B-402, Surya Enclave, Sector 14, Rohini, New Delhi 110085',
          appointmentDate: '2026-10-10',
          startTime: '10:00',
          endTime: '10:30',
          status: 'CONFIRMED',
          reason: 'Chest pain and routine ECG checkup',
          notes: 'Prior medical reports attached',
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString()
        },
        {
          id: 'apt_seed_002',
          doctorId: 'doc_002',
          patientName: 'Pooja Gupta',
          patientEmail: 'pooja.gupta@yahoo.co.in',
          patientPhone: '+91 98451 22334',
          patientAddress: 'Flat 12, Krishna Apartments, Malleshwaram, Bengaluru, Karnataka 560003',
          appointmentDate: '2026-10-11',
          startTime: '11:00',
          endTime: '11:30',
          status: 'CONFIRMED',
          reason: 'Skin allergy and routine consultation',
          notes: 'Dust allergy since 2 weeks',
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString()
        },
        {
          id: 'apt_seed_003',
          doctorId: 'doc_003',
          patientName: 'Rohan Mehta',
          patientEmail: 'rohan.mehta@outlook.com',
          patientPhone: '+91 98202 33445',
          patientAddress: '104 Sea View Heights, Worli Sea Face, Mumbai, Maharashtra 400030',
          appointmentDate: '2026-10-12',
          startTime: '14:00',
          endTime: '14:30',
          status: 'PENDING',
          reason: 'Seasonal viral fever and health checkup',
          notes: 'Follow up after 3 days',
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString()
        },
        {
          id: 'apt_seed_004',
          doctorId: 'doc_004',
          patientName: 'Neha Singh',
          patientEmail: 'neha.singh@gmail.com',
          patientPhone: '+91 98301 44556',
          patientAddress: 'Block C, Salt Lake City, Sector 2, Kolkata, West Bengal 700091',
          appointmentDate: '2026-10-13',
          startTime: '10:30',
          endTime: '11:00',
          status: 'PENDING',
          reason: 'Child vaccination and wellness check',
          notes: 'Vaccination chart required',
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString()
        }
      ];

      for (const apt of seedAppointments) {
        this.insertAppointment(apt);
      }
      console.log(`[Database] Successfully seeded ${seedAppointments.length} sample appointments.`);
    }
  }

  // --- Doctor Queries ---
  allDoctors() {
    if (this.isNativeSqlite) {
      const stmt = this.db.prepare('SELECT * FROM doctors ORDER BY id ASC');
      return stmt.all();
    }
    return [...this.inMemoryData.doctors];
  }

  getDoctorById(id) {
    if (this.isNativeSqlite) {
      const stmt = this.db.prepare('SELECT * FROM doctors WHERE id = ?');
      return stmt.get(id) || null;
    }
    return this.inMemoryData.doctors.find(d => d.id === id) || null;
  }

  getDoctorByEmail(email) {
    if (this.isNativeSqlite) {
      const stmt = this.db.prepare('SELECT * FROM doctors WHERE email = ?');
      return stmt.get(email) || null;
    }
    return this.inMemoryData.doctors.find(d => d.email.toLowerCase() === email.toLowerCase()) || null;
  }

  insertDoctor(doctor) {
    if (this.isNativeSqlite) {
      const stmt = this.db.prepare(`
        INSERT INTO doctors (id, name, specialty, email, phone, address, consultationFee, availableFrom, availableTo, createdAt)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `);
      stmt.run(
        doctor.id,
        doctor.name,
        doctor.specialty,
        doctor.email,
        doctor.phone,
        doctor.address || 'Connaught Place, New Delhi, Delhi 110001',
        doctor.consultationFee,
        doctor.availableFrom || '09:00',
        doctor.availableTo || '18:00',
        doctor.createdAt
      );
      return doctor;
    }
    this.inMemoryData.doctors.push(doctor);
    this.saveJson();
    return doctor;
  }

  // --- Appointment Queries ---
  insertAppointment(appointment) {
    if (this.isNativeSqlite) {
      const stmt = this.db.prepare(`
        INSERT INTO appointments (
          id, doctorId, patientName, patientEmail, patientPhone, patientAddress,
          appointmentDate, startTime, endTime, status, reason, notes, createdAt, updatedAt
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `);
      stmt.run(
        appointment.id,
        appointment.doctorId,
        appointment.patientName,
        appointment.patientEmail,
        appointment.patientPhone,
        appointment.patientAddress || 'New Delhi, India',
        appointment.appointmentDate,
        appointment.startTime,
        appointment.endTime,
        appointment.status || 'PENDING',
        appointment.reason,
        appointment.notes || null,
        appointment.createdAt,
        appointment.updatedAt
      );
      return appointment;
    }
    this.inMemoryData.appointments.push(appointment);
    this.saveJson();
    return appointment;
  }

  getAppointmentById(id) {
    if (this.isNativeSqlite) {
      const stmt = this.db.prepare(`
        SELECT a.*, d.name as doctorName, d.specialty as doctorSpecialty, d.consultationFee, d.address as doctorAddress
        FROM appointments a
        LEFT JOIN doctors d ON a.doctorId = d.id
        WHERE a.id = ?
      `);
      return stmt.get(id) || null;
    }
    const apt = this.inMemoryData.appointments.find(a => a.id === id);
    if (!apt) return null;
    const doc = this.inMemoryData.doctors.find(d => d.id === apt.doctorId);
    return {
      ...apt,
      doctorName: doc ? doc.name : null,
      doctorSpecialty: doc ? doc.specialty : null,
      consultationFee: doc ? doc.consultationFee : null,
      doctorAddress: doc ? doc.address : null
    };
  }

  getAppointmentsByDoctorAndDate(doctorId, appointmentDate) {
    if (this.isNativeSqlite) {
      const stmt = this.db.prepare(`
        SELECT * FROM appointments
        WHERE doctorId = ? AND appointmentDate = ? AND status != 'CANCELLED'
        ORDER BY startTime ASC
      `);
      return stmt.all(doctorId, appointmentDate);
    }
    return this.inMemoryData.appointments.filter(
      a => a.doctorId === doctorId && a.appointmentDate === appointmentDate && a.status !== 'CANCELLED'
    );
  }

  findAppointments({ doctorId, status, date, patientEmail, page = 1, limit = 10 }) {
    if (this.isNativeSqlite) {
      const conditions = [];
      const params = [];

      if (doctorId) {
        conditions.push('a.doctorId = ?');
        params.push(doctorId);
      }
      if (status) {
        conditions.push('a.status = ?');
        params.push(status);
      }
      if (date) {
        conditions.push('a.appointmentDate = ?');
        params.push(date);
      }
      if (patientEmail) {
        conditions.push('a.patientEmail = ?');
        params.push(patientEmail);
      }

      const whereClause = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : '';

      // Count query
      const countStmt = this.db.prepare(`SELECT COUNT(*) as total FROM appointments a ${whereClause}`);
      const countResult = countStmt.get(...params);
      const total = countResult ? Number(countResult.total) : 0;

      // Data query
      const offset = (page - 1) * limit;
      const dataStmt = this.db.prepare(`
        SELECT a.*, d.name as doctorName, d.specialty as doctorSpecialty, d.address as doctorAddress
        FROM appointments a
        LEFT JOIN doctors d ON a.doctorId = d.id
        ${whereClause}
        ORDER BY a.appointmentDate DESC, a.startTime ASC
        LIMIT ? OFFSET ?
      `);
      const items = dataStmt.all(...params, limit, offset);

      return {
        items,
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit) || 1
      };
    }

    // In-memory fallback filtering
    let filtered = [...this.inMemoryData.appointments];
    if (doctorId) filtered = filtered.filter(a => a.doctorId === doctorId);
    if (status) filtered = filtered.filter(a => a.status === status);
    if (date) filtered = filtered.filter(a => a.appointmentDate === date);
    if (patientEmail) filtered = filtered.filter(a => a.patientEmail.toLowerCase() === patientEmail.toLowerCase());

    const total = filtered.length;
    filtered.sort((a, b) => b.appointmentDate.localeCompare(a.appointmentDate) || a.startTime.localeCompare(b.startTime));

    const offset = (page - 1) * limit;
    const paged = filtered.slice(offset, offset + limit);

    const items = paged.map(apt => {
      const doc = this.inMemoryData.doctors.find(d => d.id === apt.doctorId);
      return {
        ...apt,
        doctorName: doc ? doc.name : null,
        doctorSpecialty: doc ? doc.specialty : null,
        doctorAddress: doc ? doc.address : null
      };
    });

    return {
      items,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit) || 1
    };
  }

  updateAppointmentStatus(id, status) {
    const updatedAt = new Date().toISOString();
    if (this.isNativeSqlite) {
      const stmt = this.db.prepare('UPDATE appointments SET status = ?, updatedAt = ? WHERE id = ?');
      stmt.run(status, updatedAt, id);
      return this.getAppointmentById(id);
    }
    const apt = this.inMemoryData.appointments.find(a => a.id === id);
    if (apt) {
      apt.status = status;
      apt.updatedAt = updatedAt;
      this.saveJson();
      return this.getAppointmentById(id);
    }
    return null;
  }

  deleteAppointment(id) {
    if (this.isNativeSqlite) {
      const stmt = this.db.prepare('DELETE FROM appointments WHERE id = ?');
      stmt.run(id);
      return true;
    }
    const idx = this.inMemoryData.appointments.findIndex(a => a.id === id);
    if (idx !== -1) {
      this.inMemoryData.appointments.splice(idx, 1);
      this.saveJson();
      return true;
    }
    return false;
  }
}

// Singleton database instance
const databaseManager = new DatabaseManager();
databaseManager.init();

module.exports = databaseManager;
