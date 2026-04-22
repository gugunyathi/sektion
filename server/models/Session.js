const mongoose = require('mongoose');

const sessionSchema = new mongoose.Schema(
  {
    userId:       { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    refreshToken: { type: String, required: true, unique: true },
    deviceInfo:   { type: String },
    ipAddress:    { type: String },
    userAgent:    { type: String },
    expiresAt:    { type: Date, required: true, index: { expireAfterSeconds: 0 } },
    revokedAt:    { type: Date },
  },
  { timestamps: true }
);

sessionSchema.index({ userId: 1, revokedAt: 1 });

module.exports = mongoose.model('Session', sessionSchema);
