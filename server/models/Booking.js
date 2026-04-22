const mongoose = require('mongoose');

const bookingSchema = new mongoose.Schema(
  {
    userId:       { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    eventId:      { type: String, required: true },
    eventTitle:   { type: String, required: true },
    eventImage:   { type: String },
    venue:        { type: String },
    city:         { type: String },
    date:         { type: String, required: true }, // ISO date string "YYYY-MM-DD"
    time:         { type: String },
    tableId:      { type: String, required: true },
    tableLabel:   { type: String },
    guests:       { type: Number, required: true, min: 1 },
    pricePerSeat: { type: Number, required: true },
    total:        { type: Number, required: true },
    heldAt:       { type: Date, default: Date.now },
    expiresAt:    { type: Date, required: true },
    confirmedAt:  { type: Date },
    cancelledAt:  { type: Date },
    rescheduledAt:{ type: Date },
    status: {
      type: String,
      enum: ['held', 'confirmed', 'expired', 'cancelled'],
      default: 'held',
    },
    notes: { type: String, maxlength: 500 },

    // Payment reference (for real payment integration)
    paymentRef:    { type: String },
    paymentMethod: { type: String },
  },
  { timestamps: true }
);

bookingSchema.index({ userId: 1, status: 1 });
bookingSchema.index({ userId: 1, date: -1 });
bookingSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0, partialFilterExpression: { status: 'held' } });

module.exports = mongoose.model('Booking', bookingSchema);
