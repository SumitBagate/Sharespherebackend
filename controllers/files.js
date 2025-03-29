const { MongoClient, GridFSBucket, ObjectId } = require("mongodb");
const multer = require("multer");
const path = require("path");
const crypto = require("crypto");

// Configure Multer for in-memory storage
const storage = multer.memoryStorage();
const upload = multer({
  storage,
  limits: { fileSize: 5 * 1024 * 1024 }, // 5MB limit
});

// ✅ Upload File
exports.uploadFile = [
  upload.single("file"),
  async (req, res) => {
    let client;
    try {
      if (!req.file) {
        return res.status(400).json({ error: "No file uploaded" });
      }

      client = new MongoClient(process.env.MONGO_URI, { useUnifiedTopology: true });
      await client.connect();

      const db = client.db();
      const bucket = new GridFSBucket(db, { bucketName: "uploads" });

      // Generate a unique filename
      const filename = crypto.randomBytes(16).toString("hex") + path.extname(req.file.originalname);

      // Create upload stream
      const uploadStream = bucket.openUploadStream(filename, {
        metadata: {
          originalName: req.file.originalname,
          size: req.file.size,
          mimetype: req.file.mimetype,
        },
      });

      // Pipe the file data into GridFS
      uploadStream.end(req.file.buffer);

      uploadStream.once("finish", async () => {
        console.log("File uploaded successfully:", filename);
        res.status(201).json({
          message: "File uploaded successfully",
          fileId: uploadStream.id,
          filename: filename,
        });
      });

      uploadStream.once("error", (err) => {
        console.error("Upload Error:", err);
        res.status(500).json({ error: "File upload failed" });
      });

    } catch (err) {
      console.error("Upload Error:", err);
      res.status(500).json({ error: err.message });
    } finally {
      if (client) client.close();
    }
  },
];

// ✅ Get File Metadata
exports.getFile = async (req, res) => {
  let client;
  try {
    const fileId = req.params.id;
    if (!ObjectId.isValid(fileId)) {
      return res.status(400).json({ error: "Invalid file ID format" });
    }

    client = new MongoClient(process.env.MONGO_URI, { useUnifiedTopology: true });
    await client.connect();
    const db = client.db();
    
    // Fetch file metadata
    const file = await db.collection("uploads.files").findOne({ _id: new ObjectId(fileId) });

    if (!file) {
      return res.status(404).json({ error: "File not found" });
    }

    res.json({
      id: file._id,
      filename: file.filename,
      originalName: file.metadata.originalName,
      size: file.metadata.size,
      mimetype: file.metadata.mimetype,
      uploadDate: file.uploadDate,
    });

  } catch (err) {
    console.error("Get File Error:", err);
    res.status(500).json({ error: err.message });
  } finally {
    if (client) client.close();
  }
};

// ✅ Delete File
exports.deleteFile = async (req, res) => {
  let client;
  try {
    const fileId = req.params.id;
    if (!ObjectId.isValid(fileId)) {
      return res.status(400).json({ error: "Invalid file ID format" });
    }

    client = new MongoClient(process.env.MONGO_URI, { useUnifiedTopology: true });
    await client.connect();
    const db = client.db();
    const bucket = new GridFSBucket(db, { bucketName: "uploads" });

    // Check if file exists
    const file = await db.collection("uploads.files").findOne({ _id: new ObjectId(fileId) });
    if (!file) {
      return res.status(404).json({ error: "File not found" });
    }

    // Delete file from GridFS
    await bucket.delete(new ObjectId(fileId));

    res.status(200).json({ message: "File deleted successfully" });

  } catch (err) {
    console.error("Delete File Error:", err);
    res.status(500).json({ error: err.message });
  } finally {
    if (client) client.close();
  }
};
