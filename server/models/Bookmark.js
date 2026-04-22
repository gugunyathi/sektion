const mongoose = require('mongoose');

const bookmarkSchema = new mongoose.Schema(
  {
    userId:   { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    type:     { type: String, enum: ['event', 'venue', 'table'], required: true },
    refId:    { type: String, required: true },
    title:    { type: String },
    subtitle: { type: String },
    image:    { type: String },
    city:     { type: String },
  },
  { timestamps: true }
);

// Prevent duplicate bookmarks
bookmarkSchema.index({ userId: 1, refId: 1 }, { unique: true });

module.exports = mongoose.model('Bookmark', bookmarkSchema);
