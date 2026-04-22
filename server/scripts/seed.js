// Server-side seed script — run with: node server/scripts/seed.js
require('dotenv').config(); // loads .env from project root

const mongoose = require('mongoose');
const connectDB = require('../config/db');
const Event = require('../models/Event');
const User = require('../models/User');

const EVENTS_SEED = [
  {
    slug: 'vox-nights-2024-01',
    title: 'Vox Nights',
    venue: 'Fabric',
    city: 'London',
    date: '2024-08-15',
    time: '22:00',
    category: 'Club',
    vibes: ['Party Animal'],
    image: '/placeholder/event-club.jpg',
    pricePerSeat: 35,
    seatsLeft: 12,
    totalSeats: 40,
    hostNote: 'Underground techno, two rooms. 18+ only.',
    trending: true,
    surge: false,
    isActive: true,
    tables: [
      {
        id: 't1',
        label: 'Front Booth',
        capacity: 4,
        taken: 1,
        perks: ['Bottle service', 'Skip queue'],
        vibe: 'Luxe',
        tableType: 'mixed',
      },
      {
        id: 't2',
        label: 'Mezzanine',
        capacity: 6,
        taken: 2,
        perks: ['View of stage'],
        vibe: 'Party Animal',
        tableType: 'mixed',
      },
    ],
  },
  {
    slug: 'omakase-nights-2024-01',
    title: 'Omakase Nights',
    venue: 'Nobu Shoreditch',
    city: 'London',
    date: '2024-08-20',
    time: '19:30',
    category: 'Dining',
    vibes: ['Foodie', 'Luxe'],
    image: '/placeholder/event-dining.jpg',
    pricePerSeat: 120,
    seatsLeft: 8,
    totalSeats: 20,
    hostNote: '9-course omakase with sake pairing. Dress code smart-casual.',
    trending: false,
    surge: false,
    isActive: true,
    tables: [
      {
        id: 't1',
        label: 'Chef Counter',
        capacity: 4,
        taken: 0,
        perks: ['Chef interaction', 'First serve'],
        vibe: 'Foodie',
        tableType: 'mixed',
      },
    ],
  },
  {
    slug: 'solar-rave-2024-01',
    title: 'Solar Rave',
    venue: 'EartH Theatre',
    city: 'London',
    date: '2024-08-25',
    time: '21:00',
    category: 'Rave',
    vibes: ['Party Animal', 'Chill'],
    image: '/placeholder/event-rave.jpg',
    pricePerSeat: 25,
    seatsLeft: 30,
    totalSeats: 80,
    hostNote: 'Outdoor sunset rave with immersive light art.',
    trending: true,
    surge: true,
    isActive: true,
    tables: [],
  },
  {
    slug: 'the-lounge-2024-01',
    title: 'The Lounge',
    venue: 'Sketch London',
    city: 'London',
    date: '2024-09-01',
    time: '20:00',
    category: 'Lounge',
    vibes: ['Chill', 'Luxe'],
    image: '/placeholder/event-lounge.jpg',
    pricePerSeat: 55,
    seatsLeft: 15,
    totalSeats: 30,
    hostNote: 'Jazz trio, craft cocktails. Low lights. Great company.',
    trending: false,
    surge: false,
    isActive: true,
    tables: [
      {
        id: 't1',
        label: 'Alcove Table',
        capacity: 2,
        taken: 0,
        perks: ['Champagne welcome', 'Priority service'],
        vibe: 'Luxe',
        tableType: 'couples',
      },
      {
        id: 't2',
        label: 'Banquette',
        capacity: 6,
        taken: 1,
        perks: ['Private area'],
        vibe: 'Chill',
        tableType: 'mixed',
      },
    ],
  },
  {
    slug: 'neon-masquerade-2024-01',
    title: 'Neon Masquerade',
    venue: 'The Velvet Room',
    city: 'London',
    date: '2024-09-07',
    time: '21:30',
    category: 'Themed',
    vibes: ['Themed', 'Party Animal'],
    image: '/placeholder/event-themed.jpg',
    pricePerSeat: 45,
    seatsLeft: 20,
    totalSeats: 50,
    hostNote: 'Masks required. Glam, neon, and mystery.',
    trending: false,
    surge: false,
    isActive: true,
    tables: [],
  },
];

async function seed() {
  try {
    await connectDB();
    console.log('Connected to DB. Seeding...');

    // Upsert events
    for (const ev of EVENTS_SEED) {
      await Event.findOneAndUpdate({ slug: ev.slug }, ev, { upsert: true, new: true });
      console.log(`  ✓ Event: ${ev.title}`);
    }

    // Create admin user if ADMIN_EMAIL set
    if (process.env.ADMIN_EMAIL) {
      let admin = await User.findOne({ email: process.env.ADMIN_EMAIL });
      if (!admin) {
        admin = await User.create({
          email: process.env.ADMIN_EMAIL,
          displayName: 'Admin',
          username: 'admin',
          provider: 'google',
          isAdmin: true,
          profileComplete: true,
        });
        console.log(`  ✓ Admin user created: ${process.env.ADMIN_EMAIL}`);
      } else if (!admin.isAdmin) {
        admin.isAdmin = true;
        await admin.save();
        console.log(`  ✓ Existing user promoted to admin: ${process.env.ADMIN_EMAIL}`);
      } else {
        console.log(`  - Admin already exists: ${process.env.ADMIN_EMAIL}`);
      }
    }

    console.log('\nSeed complete.');
    process.exit(0);
  } catch (err) {
    console.error('Seed error:', err);
    process.exit(1);
  }
}

seed();
