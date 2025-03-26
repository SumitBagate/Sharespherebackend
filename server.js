require('dotenv').config();
const express = require('express');
const cors = require('cors');
const connectDB = require('./config/db');
const fileRoutes = require('./routes/files');
const mongoose = require('mongoose');

const app = express();

// Connect to MongoDB with GridFS initialization
connectDB().then(() => {
  // Verify GridFS connection
  const gfsPromise = new Promise((resolve) => {
    mongoose.connection.once('open', () => {
      console.log('GridFS connection established');
      resolve();
    });
  });

  // Middleware
  app.use(cors());
  app.use(express.json({ limit: '5mb' })); // Increased payload limit

  // Routes
  app.use('/api', fileRoutes);

  // Error handling middleware
  app.use((err, req, res, next) => {
    console.error(err.stack);
    res.status(500).json({ 
      error: 'File upload failed',
      details: process.env.NODE_ENV === 'development' ? err.message : null
    });
  });

  const PORT = process.env.PORT || 5000;
  app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
    console.log(`Upload endpoint: POST http://localhost:${PORT}/api/upload`);
  });

  return gfsPromise;
}).catch(err => {
  console.error('Server startup failed:', err);
  process.exit(1);
});