const mongoose = require('mongoose');

const userInteractionSchema = new mongoose.Schema(
  {
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    action: { type: String, enum: ['like', 'comment', 'share'], required: true, index: true },
    eventId: { type: String, required: true, index: true },
    title: { type: String },
    venue: { type: String },
    city: { type: String },
    eventDate: { type: String },
    metadata: { type: Object },
  },
  { timestamps: true }
);

userInteractionSchema.index({ userId: 1, eventId: 1, action: 1, createdAt: -1 });

module.exports = mongoose.model('UserInteraction', userInteractionSchema);
