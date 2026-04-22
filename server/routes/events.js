const router = require('express').Router();
const Event = require('../models/Event');
const { optionalAuth } = require('../middleware/auth');

// ── GET /api/events ──────────────────────────────────────
router.get('/', optionalAuth, async (req, res) => {
  const { city, vibe, category, q, page = 1, limit = 20 } = req.query;
  const filter = { isActive: true };

  if (city)     filter.city = { $regex: new RegExp(city, 'i') };
  if (category) filter.category = category;
  if (vibe)     filter.vibes = { $in: Array.isArray(vibe) ? vibe : [vibe] };
  if (q)        filter.$or = [
    { title: { $regex: new RegExp(q, 'i') } },
    { venue: { $regex: new RegExp(q, 'i') } },
    { city:  { $regex: new RegExp(q, 'i') } },
  ];

  const skip = (Number(page) - 1) * Number(limit);
  const [events, total] = await Promise.all([
    Event.find(filter).sort({ trending: -1, date: 1 }).skip(skip).limit(Number(limit)).lean(),
    Event.countDocuments(filter),
  ]);

  res.json({ events, total, page: Number(page), pages: Math.ceil(total / Number(limit)) });
});

// ── GET /api/events/:id ──────────────────────────────────
router.get('/:id', optionalAuth, async (req, res) => {
  const event = await Event.findById(req.params.id).lean();
  if (!event) return res.status(404).json({ error: 'Event not found' });
  res.json(event);
});

module.exports = router;
