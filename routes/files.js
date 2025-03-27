const express = require('express');
const router = express.Router();
const fileController = require('../controllers/files');

// Upload file route
router.post('/upload', fileController.uploadFile);

// Get all files route
router.get('/files', fileController.getAllFiles);

// Get single file route
router.get('/files/:id', fileController.getFile);

// ✅ Add the download route **before** exporting
router.get('/download/:id', fileController.downloadFile);

// ✅ Export after defining all routes
module.exports = router;
