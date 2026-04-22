const mongoose = require('mongoose');

const otpSchema = new mongoose.Schema(
  {
    phone:     { type: String, required: true, index: true },
    codeHash:  { type: String, required: true }, // bcrypt hash of OTP
    expiresAt: { type: Date, required: true, index: { expireAfterSeconds: 0 } },
    used:      { type: Boolean, default: false },
    attempts:  { type: Number, default: 0 },
    ipAddress: { type: String },
  },
  { timestamps: true }
);

module.exports = mongoose.model('OtpCode', otpSchema);
