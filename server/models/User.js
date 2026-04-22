const mongoose = require('mongoose');

const userSchema = new mongoose.Schema(
  {
    username: {
      type: String,
      unique: true,
      sparse: true,
      lowercase: true,
      trim: true,
      match: [/^[a-z0-9._]{3,30}$/, 'Invalid username format'],
    },
    displayName: { type: String, trim: true, maxlength: 60 },
    email:       { type: String, lowercase: true, trim: true, sparse: true, unique: true },
    phone:       { type: String, sparse: true, unique: true },
    photoURL:    { type: String },
    provider:    { type: String, enum: ['google', 'phone'], required: true },
    googleId:    { type: String, sparse: true, unique: true },

    profileComplete: { type: Boolean, default: false },
    bio:    { type: String, maxlength: 240 },
    city:   { type: String, maxlength: 60 },
    vibes:  [{ type: String }],

    isAdmin:   { type: Boolean, default: false },
    isBanned:  { type: Boolean, default: false },
    bannedAt:  { type: Date },
    banReason: { type: String },

    lastSeen:  { type: Date, default: Date.now },
  },
  { timestamps: true }
);

userSchema.methods.toPublicJSON = function () {
  return {
    id: this._id,
    username: this.username,
    displayName: this.displayName,
    email: this.email,
    phone: this.phone,
    photoURL: this.photoURL,
    provider: this.provider,
    profileComplete: this.profileComplete,
    bio: this.bio,
    city: this.city,
    vibes: this.vibes,
    isAdmin: this.isAdmin,
    createdAt: this.createdAt,
  };
};

module.exports = mongoose.model('User', userSchema);
