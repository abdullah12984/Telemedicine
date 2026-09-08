const express = require('express');
const cors = require('cors');
const path = require('path');
const http = require('http');
const { Server } = require('socket.io');
require('dotenv').config();
const { PrismaClient } = require('@prisma/client');
const registerVideoCallSocket = require("./socket/videoCallSocket");
const app = express();
const PORT = process.env.PORT || 5000;
const prisma = new PrismaClient();
const server = http.createServer(app);
const io = new Server(server, {
  cors: {
    origin: 'http://localhost:5173',
    methods: ['GET', 'POST'],
  },
});
registerVideoCallSocket(io);
// Middleware
app.use(cors());
app.use(express.json());

// ============ ADD THIS: Serve static files for uploads ============
app.use('/uploads', express.static(path.join(__dirname, '..', 'uploads')));

// Import routes
const authRoutes = require('./routes/authRoutes');
const patientRoutes = require('./routes/patientRoutes');
const providerRoutes = require("./routes/providerRoutes");
const nurseRoutes = require("./routes/nurseRoutes");
const adminRoutes = require("./routes/adminRoutes");
// Routes
app.get('/', (req, res) => {
  res.json({
    message: 'Telemedicine Backend is running!',
    endpoints: {
      auth: '/api/auth',
      patient: '/api/patient',
      provider: "/api/provider",
      nurse: "/api/nurse",
      admin: "/api/admin",
      uploads: '/uploads'
    }
  });
});

// API routes
app.use('/api/auth', authRoutes);
app.use('/api/patient', patientRoutes);
app.use("/api/provider", providerRoutes);
app.use("/api/nurse", nurseRoutes);
app.use("/api/admin", adminRoutes);
// Health check
app.get('/api/health', async (req, res) => {
  try {
    await prisma.$queryRaw`SELECT 1`;
    res.json({
      status: 'OK',
      database: 'Connected',
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    res.status(500).json({
      status: 'ERROR',
      database: 'Disconnected',
      error: error.message
    });
  }
});

// Error handling
app.use((err, req, res, next) => {
  console.error('Error:', err.stack);
  res.status(500).json({
    message: 'Something went wrong!',
    error: process.env.NODE_ENV === 'development' ? err.message : undefined
  });
});

server.listen(PORT, () => {
  console.log(`🚀 Server running on http://localhost:${PORT}`);
  console.log(`📊 Health: http://localhost:${PORT}/api/health`);
  console.log(`🔐 Auth: http://localhost:${PORT}/api/auth`);
  console.log(`👤 Patient: http://localhost:${PORT}/api/patient`);
  console.log(`👨‍⚕️ Provider: http://localhost:${PORT}/api/provider`);
  console.log(`👩‍⚕️ Nurse: http://localhost:${PORT}/api/nurse`);
  console.log(`👨‍💼 Admin: http://localhost:${PORT}/api/admin`);
  console.log(`📁 Uploads: http://localhost:${PORT}/uploads`);  // <-- ADD THIS
});