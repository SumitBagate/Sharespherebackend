const express = require('express');
const router = express.Router();
const fileController = require('../controllers/files'); // Ensure the correct path

// Define routes and link them to the controller functions
router.post('/upload', fileController.uploadFile);
router.get('/all', fileController.getAllFiles);
router.get('/download/:id', fileController.downloadFile);
router.get('/preview/:id', fileController.previewFile);
router.get('/:id', fileController.getFile); // This was failing before because getFile was missing
router.delete('/:id', fileController.deleteFile);

module.exports = router;
