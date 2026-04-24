/**
 * Migration: patch-add-default-tables
 *
 * Adds 3 default tables (t1, t2, t3) to every DB event that currently has
 * no tables array, or an empty tables array. Safe to run multiple times —
 * skips events that already have tables.
 *
 * Usage:
 *   node server/scripts/migrate-add-default-tables.js
 *
 * Requires MONGODB_URI in .env (or environment).
 */
require('dotenv').config();

const mongoose = require('mongoose');
const connectDB = require('../config/db');
const Event = require('../models/Event');

function buildDefaultTables(totalSeats) {
  const cap = Math.max(2, Math.ceil(totalSeats / 3));
  return [
    {
      id: 't1',
      label: 'Table 01 · Centre Stage',
      capacity: cap + 2,
      taken: 0,
      perks: ['Bottle service', 'Best view'],
      vibe: 'High-energy',
      tableType: 'host_pays',
      includedItems: [],
    },
    {
      id: 't2',
      label: 'Table 02 · Skyline Booth',
      capacity: cap,
      taken: 0,
      perks: ['DJ access', 'Curated mix'],
      vibe: 'Curated mix',
      tableType: 'lgbtq',
      includedItems: [],
    },
    {
      id: 't3',
      label: 'Table 03 · Lounge Side',
      capacity: Math.max(2, cap - 1),
      taken: 0,
      perks: ['Low-key vibes', 'Conversational'],
      vibe: 'Conversational',
      tableType: 'couples',
      includedItems: [],
    },
  ];
}

async function run() {
  await connectDB();
  console.log('Connected to MongoDB.\n');

  // Find all active events with no tables (or empty tables array)
  const events = await Event.find({
    isActive: true,
    $or: [{ tables: { $exists: false } }, { tables: { $size: 0 } }],
  }).select('_id title totalSeats tables');

  if (events.length === 0) {
    console.log('✅  No events need patching. All events already have tables.');
    await mongoose.disconnect();
    return;
  }

  console.log(`Found ${events.length} event(s) to patch:\n`);

  let patched = 0;
  for (const event of events) {
    const tables = buildDefaultTables(event.totalSeats || 0);
    await Event.findByIdAndUpdate(event._id, { $set: { tables } });
    console.log(`  ✓ "${event.title}" (${event._id}) — added ${tables.length} tables`);
    patched++;
  }

  console.log(`\n✅  Done. Patched ${patched} event(s).`);
  await mongoose.disconnect();
}

run().catch((err) => {
  console.error('Migration failed:', err);
  process.exit(1);
});
