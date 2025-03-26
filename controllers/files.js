const { MongoClient, GridFSBucket } = require('mongodb');
const multer = require('multer');
const path = require('path');
const crypto = require('crypto');

// Configure multer for memory storage
const storage = multer.memoryStorage();
const upload = multer({ 
  storage,
  limits: { fileSize: 5 * 1024 * 1024 } // 5MB limit
});

// File upload handler
exports.uploadFile = [
  upload.single('file'),
  async (req, res) => {
    try {
      if (!req.file) {
        return res.status(400).json({ error: 'No file uploaded' });
      }

      const client = new MongoClient(process.env.MONGO_URI);
      await client.connect();
      
      const db = client.db();
      const bucket = new GridFSBucket(db, { bucketName: 'uploads' });
      
      // Generate unique filename
      const filename = crypto.randomBytes(16).toString('hex') + 
                       path.extname(req.file.originalname);
      
      // Create upload stream
      const uploadStream = bucket.openUploadStream(filename, {
        metadata: { 
          originalName: req.file.originalname,
          size: req.file.size,
          mimetype: req.file.mimetype
        }
      });
      
      // Pipe the file data
      uploadStream.end(req.file.buffer);
      
      uploadStream.on('finish', () => {
        client.close();
        res.status(201).json({
          message: 'File uploaded successfully',
          fileId: uploadStream.id,
          filename: filename
        });
      });
      
    } catch (err) {
      res.status(500).json({ error: err.message });
    }
  }
];

// Get all files
exports.getAllFiles = async (req, res) => {
  try {
    const client = new MongoClient(process.env.MONGO_URI);
    await client.connect();
    const db = client.db();
    const files = await db.collection('uploads.files').find().toArray();
    client.close();
    res.json(files);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// Get single file
exports.getFile = async (req, res) => {
  try {
    const client = new MongoClient(process.env.MONGO_URI);
    await client.connect();
    const db = client.db();
    const bucket = new GridFSBucket(db, { bucketName: 'uploads' });
    
    const file = await db.collection('uploads.files').findOne({ 
      _id: new require('mongodb').ObjectId(req.params.id) 
    });
    
    if (!file) {
      client.close();
      return res.status(404).json({ error: 'File not found' });
    }
    
    const downloadStream = bucket.openDownloadStream(file._id);
    downloadStream.pipe(res);
    
    downloadStream.on('end', () => client.close());
    
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};