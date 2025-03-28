const mongoose = require('mongoose');

const LikeSchema = new mongoose.Schema({
  user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  file: { type: mongoose.Schema.Types.ObjectId, ref: 'File', required: true },
  createdAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model('Like', LikeSchema);
