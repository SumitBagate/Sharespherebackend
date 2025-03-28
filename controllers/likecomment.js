const Like = require('../models/like');
const Comment = require('../models/comment');
const File = require('../models/File');

// Add Like
exports.addLike = async (req, res) => {
  try {
    const { fileId } = req.params;
    const userId = req.user.id;

    // Check if user already liked the file
    const existingLike = await Like.findOne({ file: fileId, user: userId });
    if (existingLike) {
      return res.status(400).json({ message: 'You already liked this file' });
    }

    // Add like
    const like = new Like({ user: userId, file: fileId });
    await like.save();

    // Update file document
    await File.findByIdAndUpdate(fileId, { $push: { likes: like._id } });

    res.status(201).json({ message: 'File liked successfully' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// Remove Like
exports.removeLike = async (req, res) => {
  try {
    const { fileId } = req.params;
    const userId = req.user.id;

    // Remove like
    const like = await Like.findOneAndDelete({ file: fileId, user: userId });
    if (!like) {
      return res.status(404).json({ message: 'Like not found' });
    }

    // Update file document
    await File.findByIdAndUpdate(fileId, { $pull: { likes: like._id } });

    res.status(200).json({ message: 'Like removed successfully' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

//  Add Comment
exports.addComment = async (req, res) => {
  try {
    const { fileId } = req.params;
    const userId = req.user.id;
    const { text } = req.body;

    // Create comment
    const comment = new Comment({ user: userId, file: fileId, text });
    await comment.save();

    // Update file document
    await File.findByIdAndUpdate(fileId, { $push: { comments: comment._id } });

    res.status(201).json({ message: 'Comment added successfully', comment });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// Get Comments for a File
exports.getComments = async (req, res) => {
  try {
    const { fileId } = req.params;

    // Fetch comments and populate user info
    const comments = await Comment.find({ file: fileId }).populate('user', 'name');

    res.json(comments);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};
