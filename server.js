const app = require('./src/app');
const config = require('./src/config/env');

const server = app.listen(config.port, () => {
  console.log(`=======================================================`);
  console.log(`🚀 SmartCare Appointment Booking Server is running`);
  console.log(`📍 URL: http://localhost:${config.port}`);
  console.log(`🩺 Health Check: http://localhost:${config.port}/api/v1/health`);
  console.log(`📋 Doctors API: http://localhost:${config.port}/api/v1/doctors`);
  console.log(`📅 Appointments API: http://localhost:${config.port}/api/v1/appointments`);
  console.log(`⚙️  Environment: ${config.nodeEnv}`);
  console.log(`=======================================================`);
});

server.on('error', (err) => {
  if (err.code === 'EADDRINUSE') {
    console.error(`\n❌ [Server Error] Port ${config.port} is already in use by another application!`);
    console.error(`💡 Solution: Another instance is running, or another app is using port ${config.port}.`);
    console.error(`   You can set a different port in .env (e.g. PORT=5001) or terminate the occupying process.\n`);
    process.exit(1);
  } else {
    console.error('[Server Error]', err);
    process.exit(1);
  }
});

// Graceful Shutdown
function handleShutdown(signal) {
  console.log(`\n[Server] Received ${signal}. Shutting down gracefully...`);
  server.close(() => {
    console.log('[Server] HTTP server closed.');
    process.exit(0);
  });

  // Force close after 10s if hanging
  setTimeout(() => {
    console.error('[Server] Could not close connections in time, forcefully shutting down');
    process.exit(1);
  }, 10000);
}

process.on('SIGTERM', () => handleShutdown('SIGTERM'));
process.on('SIGINT', () => handleShutdown('SIGINT'));

// Catch Unhandled Exceptions & Rejections
process.on('uncaughtException', (err) => {
  console.error('[FATAL] Uncaught Exception:', err);
  process.exit(1);
});

process.on('unhandledRejection', (reason, promise) => {
  console.error('[FATAL] Unhandled Rejection at:', promise, 'reason:', reason);
  process.exit(1);
});
