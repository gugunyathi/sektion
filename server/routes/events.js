const router = require('express').Router();
const Event = require('../models/Event');
const { optionalAuth, requireAuth } = require('../middleware/auth');

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

// ── GET /api/events/:id/media ─────────────────────────────
// Returns the media array for an event (approved items only for guests)
router.get('/:id/media', optionalAuth, async (req, res) => {
  const event = await Event.findById(req.params.id).select('media').lean();
  if (!event) return res.status(404).json({ error: 'Event not found' });

  const isHost = req.user && String(event.createdBy) === String(req.user._id);
  const items = (event.media ?? []).filter(
    (m) => isHost || m.status === 'approved',
  );
  res.json({ media: items });
});

// ── POST /api/events/:id/media ────────────────────────────
// Seed or add a system media item (admin/internal use)
router.post('/:id/media', requireAuth, async (req, res) => {
  const { id: mediaId, kind, src, poster, caption, uploadedBy = 'system' } = req.body;

  if (!mediaId || !kind || !src) {
    return res.status(400).json({ error: 'id, kind, and src are required' });
  }
  if (!['video', 'image'].includes(kind)) {
    return res.status(400).json({ error: 'kind must be video or image' });
  }

  const event = await Event.findByIdAndUpdate(
    req.params.id,
    {
      $push: {
        media: { id: mediaId, kind, src, poster, caption, uploadedBy, status: 'approved', flags: 0 },
      },
    },
    { new: true, select: 'media' },
  );
  if (!event) return res.status(404).json({ error: 'Event not found' });

  res.status(201).json({ media: event.media });
});

// ── DELETE /api/events/:id/media/:mediaId ─────────────────
router.delete('/:id/media/:mediaId', requireAuth, async (req, res) => {
  const event = await Event.findByIdAndUpdate(
    req.params.id,
    { $pull: { media: { id: req.params.mediaId } } },
    { new: true, select: 'media' },
  );
  if (!event) return res.status(404).json({ error: 'Event not found' });
  res.json({ media: event.media });
});

module.exports = router;
