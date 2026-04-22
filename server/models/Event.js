const mongoose = require('mongoose');

const includedItemSchema = new mongoose.Schema({
  id:       String,
  emoji:    String,
  name:     String,
  category: { type: String, enum: ['drink', 'food', 'mixer', 'extra'] },
  image:    String,
}, { _id: false });

const tableSchema = new mongoose.Schema({
  id:       String,
  label:    String,
  capacity: Number,
  taken:    { type: Number, default: 0 },
  perks:    [String],
  vibe:     String,
  tableType:{ type: String, enum: ['mixed', 'gender_ratio', 'lgbtq', 'couples', 'host_pays'] },
  includedItems: [includedItemSchema],
}, { _id: false });

const eventSchema = new mongoose.Schema(
  {
    slug:        { type: String, unique: true },
    title:       { type: String, required: true, trim: true },
    venue:       { type: String, required: true },
    city:        { type: String, required: true },
    date:        { type: String, required: true },
    time:        { type: String },
    category:    { type: String, enum: ['Club', 'Dining', 'Lounge', 'Rave', 'Themed'] },
    vibes:       [String],
    image:       { type: String },
    pricePerSeat:{ type: Number, required: true },
    seatsLeft:   { type: Number, default: 0 },
    totalSeats:  { type: Number, default: 0 },
    hostNote:    { type: String },
    trending:    { type: Boolean, default: false },
    surge:       { type: Boolean, default: false },
    isActive:    { type: Boolean, default: true },
    tables:      [tableSchema],
    createdBy:   { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  },
  { timestamps: true }
);

eventSchema.index({ city: 1, date: 1, isActive: 1 });
eventSchema.index({ vibes: 1 });

module.exports = mongoose.model('Event', eventSchema);
