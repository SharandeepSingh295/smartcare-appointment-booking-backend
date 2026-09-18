const path = require('path');
const dotenv = require('dotenv');

// Load environment variables from .env
dotenv.config({ path: path.resolve(__dirname, '../../.env') });

const config = {
  port: parseInt(process.env.PORT, 10) || 5000,
  nodeEnv: process.env.NODE_ENV || 'development',
  dbType: process.env.DB_TYPE || 'sqlite',
  dbFilePath: process.env.DB_FILE_PATH || path.resolve(__dirname, '../../data/smartcare.db'),
  business: {
    operatingHoursStart: process.env.OPERATING_HOURS_START || '09:00',
    operatingHoursEnd: process.env.OPERATING_HOURS_END || '18:00',
    slotDurationMinutes: parseInt(process.env.SLOT_DURATION_MINUTES, 10) || 30
  }
};

module.exports = config;
