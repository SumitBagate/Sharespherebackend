const express = require('express');
const router = express.Router();
const fileController = require('../controllers/files');

// Upload file route
router.post('/upload', fileController.uploadFile);

// Get all files route
router.get('/files', fileController.getAllFiles);

// Get single file route
router.get('/files/:id', fileController.getFile);

// Download file route
router.get('/download/:id', fileController.downloadFile);

// Preview file route
router.get('/preview/:id', fileController.previewFile);

// ✅ Delete file route
router.delete('/files/:id', fileController.deleteFile);

// ✅ Export after defining all routes
module.exports = router;
