const mongoose = require('mongoose');

const mediaSchema = new mongoose.Schema(
  {
    userId:  { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    eventId: { type: String, required: true, index: true },
    url:     { type: String, required: true },
    thumbUrl:{ type: String },
    kind:    { type: String, enum: ['image', 'video'], required: true },
    caption: { type: String, maxlength: 280 },
    status:  { type: String, enum: ['pending', 'approved', 'frozen'], default: 'pending' },
    flags:   { type: Number, default: 0 },

    flaggedBy:  [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
    reviewedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    reviewedAt: { type: Date },
    freezeReason: { type: String },
  },
  { timestamps: true }
);

mediaSchema.index({ eventId: 1, status: 1 });
mediaSchema.index({ status: 1 });

module.exports = mongoose.model('Media', mediaSchema);
