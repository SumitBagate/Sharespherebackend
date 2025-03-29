require('dotenv').config();
const express = require('express');
const cors = require('cors');
const connectDB = require('./config/db');
const mongoose = require('mongoose');

const fileRoutes = require('./routes/files'); // Ensure correct import
const likeCommentRoutes = require('./routes/likecomment.js'); // Ensure correct import

const app = express();

// Middleware
app.use(cors());
app.use(express.json({ limit: '5mb' })); // Increased payload limit

// Connect to MongoDB
connectDB().then(() => {
  // Verify GridFS connection
  mongoose.connection.once('open', () => {
    console.log('GridFS connection established');
  });

  // ✅ Use Routes AFTER successful DB connection
  app.use('/api', fileRoutes);
  app.use('/api', likeCommentRoutes);

  // Error handling middleware
  app.use((err, req, res, next) => {
    console.error(err.stack);
    res.status(500).json({ 
      error: 'File upload failed',
      details: process.env.NODE_ENV === 'development' ? err.message : null
    });
  });

  // ✅ Set PORT Correctly for Render Deployment
  const PORT = process.env.PORT || 10000; // Ensure it matches Render logs
  app.listen(PORT, '0.0.0.0', () => { // Bind to 0.0.0.0 for Render
    console.log(`Server running on port ${PORT}`);
    console.log(`Upload endpoint: POST https://sharespherebackend.onrender.com/api/upload`);
  });

}).catch(err => {
  console.error('Server startup failed:', err);
  process.exit(1);
});
