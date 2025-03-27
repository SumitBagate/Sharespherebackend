const { MongoClient, GridFSBucket, ObjectId } = require('mongodb');
const multer = require('multer');
const path = require('path');
const crypto = require('crypto');

// Configure multer for memory storage
const storage = multer.memoryStorage();
const upload = multer({ 
  storage,
  limits: { fileSize: 5 * 1024 * 1024 } // 5MB limit
});

// ✅ Upload File
exports.uploadFile = [
  upload.single('file'),
  async (req, res) => {
    let client;
    try {
      if (!req.file) {
        return res.status(400).json({ error: 'No file uploaded' });
      }

      client = new MongoClient(process.env.MONGO_URI);
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

      // Pipe file data
      uploadStream.end(req.file.buffer);

      uploadStream.on('finish', () => {
        client.close();
        res.status(201).json({
          message: 'File uploaded successfully',
          fileId: uploadStream.id,
          filename: filename
        });
      });

      uploadStream.on('error', (err) => {
        console.error('Upload Error:', err);
        res.status(500).json({ error: 'File upload failed' });
        client.close();
      });

    } catch (err) {
      if (client) client.close();
      res.status(500).json({ error: err.message });
    }
  }
];

// ✅ Get All Files
exports.getAllFiles = async (req, res) => {
  let client;
  try {
    client = new MongoClient(process.env.MONGO_URI);
    await client.connect();
    const db = client.db();
    const files = await db.collection('uploads.files').find().toArray();
    res.json(files);
  } catch (err) {
    res.status(500).json({ error: err.message });
  } finally {
    if (client) client.close();
  }
};

// ✅ Preview File (Inline Display)
exports.getFile = async (req, res) => {
  let client;
  try {
    client = new MongoClient(process.env.MONGO_URI);
    await client.connect();
    const db = client.db();
    const bucket = new GridFSBucket(db, { bucketName: 'uploads' });

    const file = await db.collection('uploads.files').findOne({
      _id: new ObjectId(req.params.id)
    });

    if (!file) {
      client.close();
      return res.status(404).json({ error: 'File not found' });
    }

    // ✅ Set headers for inline preview
    res.setHeader('Content-Type', file.metadata.mimetype || 'application/octet-stream');
    res.setHeader('Content-Disposition', 'inline');

    const downloadStream = bucket.openDownloadStream(file._id);
    downloadStream.pipe(res);

    downloadStream.on('error', (err) => {
      console.error('Preview error:', err);
      res.status(500).json({ error: 'Preview failed' });
      client.close();
    });

    downloadStream.on('end', () => client.close());

  } catch (err) {
    if (client) client.close();
    res.status(500).json({ error: err.message });
  }
};

// ✅ Download File
exports.downloadFile = async (req, res) => {
  let client;
  try {
    client = new MongoClient(process.env.MONGO_URI);
    await client.connect();
    const db = client.db();
    const bucket = new GridFSBucket(db, { bucketName: 'uploads' });

    const file = await db.collection('uploads.files').findOne({ _id: new ObjectId(req.params.id) });

    if (!file) {
      client.close();
      return res.status(404).json({ error: 'File not found' });
    }

    res.setHeader('Content-Disposition', `attachment; filename="${file.filename}"`);
    res.setHeader('Content-Type', file.metadata.mimetype || 'application/octet-stream');

    const downloadStream = bucket.openDownloadStream(file._id);
    downloadStream.pipe(res);

    downloadStream.on('error', (err) => {
      console.error('Download error:', err);
      res.status(500).json({ error: 'Download failed' });
      client.close();
    });

    downloadStream.on('end', () => client.close());

  } catch (err) {
    if (client) client.close();
    res.status(500).json({ error: err.message });
  }
};

// ✅ Delete File
exports.deleteFile = async (req, res) => {
  let client;
  try {
    client = new MongoClient(process.env.MONGO_URI);
    await client.connect();
    const db = client.db();
    const bucket = new GridFSBucket(db, { bucketName: 'uploads' });

    let fileId;
    try {
      fileId = new ObjectId(req.params.id);
    } catch (err) {
      client.close();
      return res.status(400).json({ error: 'Invalid file ID format' });
    }

    // Check if file exists
    const file = await db.collection('uploads.files').findOne({ _id: fileId });
    if (!file) {
      client.close();
      return res.status(404).json({ error: 'File not found' });
    }

    // Delete file from GridFS
    await bucket.delete(fileId);

    client.close();
    res.status(200).json({ message: 'File deleted successfully' });

  } catch (err) {
    if (client) client.close();
    res.status(500).json({ error: err.message });
  }
};
