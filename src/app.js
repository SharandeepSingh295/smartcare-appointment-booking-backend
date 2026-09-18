const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const config = require('./config/env');
const apiRoutes = require('./routes/index');
const notFoundHandler = require('./middlewares/notFound.middleware');
const errorHandler = require('./middlewares/error.middleware');

const app = express();

// Security and HTTP Request Headers
app.use(helmet());

// Enable Cross-Origin Resource Sharing
app.use(cors());

// HTTP Request Logger
if (config.nodeEnv !== 'test') {
  app.use(morgan('dev'));
}

// Request Body Parsers
app.use(express.json({ limit: '10kb' }));
app.use(express.urlencoded({ extended: true, limit: '10kb' }));

// Root endpoint
app.get('/', (req, res) => {
  res.json({
    message: 'SmartCare Appointment Booking API is running',
    version: '1.0.0',
    endpoints: {
      health: '/api/v1/health',
      doctors: '/api/v1/doctors',
      appointments: '/api/v1/appointments'
    }
  });
});

// Mount Main API Router
app.use('/api/v1', apiRoutes);

// 404 Route Not Found Handler
app.use(notFoundHandler);

// Centralized Global Error Handler
app.use(errorHandler);

module.exports = app;
