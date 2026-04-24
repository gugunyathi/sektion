// One-time script: approve all media on the Savanna Durban July event
// Run: node server/scripts/approve-savanna-media.js
require('dotenv').config();

const mongoose = require('mongoose');
const connectDB = require('../config/db');
const Event = require('../models/Event');

(async () => {
  await connectDB();

  // Find Savanna event by title (case-insensitive match)
  const events = await Event.find({ title: /savanna/i });
  if (!events.length) {
    console.log('❌ No Savanna events found.');
    process.exit(1);
  }

  let totalPatched = 0;
  for (const event of events) {
    let changed = false;
    for (const item of event.media) {
      if (item.status !== 'approved') {
        console.log(`  Approving media ${item.id} (was: ${item.status}) on "${event.title}"`);
        item.status = 'approved';
        item.flags = 0;
        changed = true;
        totalPatched++;
      }
    }
    if (changed) await event.save();
    console.log(`✅ "${event.title}" — ${event.media.length} media items, ${event.media.filter(m => m.status === 'approved').length} approved`);
  }

  console.log(`\nDone. Patched ${totalPatched} media item(s).`);
  process.exit(0);
})().catch((err) => { console.error(err); process.exit(1); });
