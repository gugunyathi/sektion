const router = require('express').Router();
const Event = require('../models/Event');
const { optionalAuth, requireAuth } = require('../middleware/auth');
const { uploadMedia, toPublicUrl } = require('../middleware/upload');
const path = require('path');

// ── GET /api/events ──────────────────────────────────────
router.get('/', optionalAuth, async (req, res) => {
  const { city, vibe, category, q, mine, page = 1, limit = 20 } = req.query;
  const filter = { isActive: true };

  if (city)     filter.city = { $regex: new RegExp(city, 'i') };
  if (category) filter.category = category;
  if (vibe)     filter.vibes = { $in: Array.isArray(vibe) ? vibe : [vibe] };
  if (q)        filter.$or = [
    { title: { $regex: new RegExp(q, 'i') } },
    { venue: { $regex: new RegExp(q, 'i') } },
    { city:  { $regex: new RegExp(q, 'i') } },
  ];
  // Filter to current user's events only
  if (mine === '1' && req.user) {
    filter.createdBy = req.user._id;
  }

  const skip = (Number(page) - 1) * Number(limit);
  const [events, total] = await Promise.all([
    Event.find(filter).sort({ createdAt: -1, trending: -1, date: 1 }).skip(skip).limit(Number(limit)).lean(),
    Event.countDocuments(filter),
  ]);

  res.json({ events, total, page: Number(page), pages: Math.ceil(total / Number(limit)) });
});

// ── POST /api/events ─────────────────────────────────────
// Authenticated users create a new event/sektion
router.post('/', requireAuth, async (req, res) => {
  const {
    title, venue, city, date, time, category, vibes,
    pricePerSeat, totalSeats, seatsLeft, hostNote, trending, surge,
    mediaUrls,
  } = req.body;

  if (!title || !venue || !city || !date || !category) {
    return res.status(400).json({ error: 'title, venue, city, date, and category are required' });
  }

  const validCategories = ['Club', 'Dining', 'Lounge', 'Rave', 'Themed'];
  if (!validCategories.includes(category)) {
    return res.status(400).json({ error: 'Invalid category' });
  }

  const slug = `${title.toLowerCase().replace(/[^a-z0-9]+/g, '-')}-${Date.now()}`;

  // Convert mediaUrls to media array items — approved so they show immediately in feed
  const media = (Array.isArray(mediaUrls) ? mediaUrls : []).map((url, idx) => ({
    id: `m-${Date.now()}-${idx}`,
    kind: url.includes('video') || url.endsWith('.mp4') || url.endsWith('.mov') ? 'video' : 'image',
    src: url,
    uploadedBy: String(req.user._id),
    status: 'approved',
    flags: 0,
  }));

  const event = await Event.create({
    slug,
    title: title.trim(),
    venue: venue.trim(),
    city: city.trim(),
    date,
    time: time || '',
    category,
    vibes: Array.isArray(vibes) ? vibes : [],
    pricePerSeat: Number(pricePerSeat) || 0,
    totalSeats: Number(totalSeats) || 0,
    seatsLeft: Number(seatsLeft ?? totalSeats) || 0,
    hostNote: (hostNote || '').trim(),
    trending: Boolean(trending),
    surge: Boolean(surge),
    media,
    isActive: true,
    createdBy: req.user._id,
  });

  res.status(201).json(event);
});

// ── GET /api/events/:id ──────────────────────────────────
router.get('/:id', optionalAuth, async (req, res) => {
  const event = await Event.findById(req.params.id).lean();
  if (!event) return res.status(404).json({ error: 'Event not found' });
  res.json(event);
});

// ── GET /api/events/:id/media ─────────────────────────────
router.get('/:id/media', optionalAuth, async (req, res) => {
  const event = await Event.findById(req.params.id).select('media createdBy').lean();
  if (!event) return res.status(404).json({ error: 'Event not found' });

  const isOwner = req.user && String(event.createdBy) === String(req.user._id);
  const items = (event.media ?? []).filter(
    (m) => isOwner || m.status === 'approved',
  );
  res.json({ media: items });
});

// ── POST /api/events/:id/media/upload ─────────────────────
// Owner uploads a file to their event
router.post('/:id/media/upload', requireAuth, uploadMedia.single('media'), async (req, res) => {
  const event = await Event.findById(req.params.id).select('createdBy media');
  if (!event) return res.status(404).json({ error: 'Event not found' });

  if (String(event.createdBy) !== String(req.user._id)) {
    return res.status(403).json({ error: 'Only the event owner can upload media' });
  }

  if (!req.file) {
    return res.status(400).json({ error: 'No file uploaded' });
  }

  const kind = req.file.mimetype.startsWith('video/') ? 'video' : 'image';
  const relativePath = path.relative(
    path.join(__dirname, '../uploads'),
    req.file.path,
  ).replace(/\\/g, '/');
  const src = toPublicUrl(req, relativePath);

  const mediaItem = {
    id: `m-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
    kind,
    src,
    uploadedBy: String(req.user._id),
    status: 'pending',
    flags: 0,
  };

  event.media.push(mediaItem);
  await event.save();

  res.status(201).json({ mediaItem });
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
// Owner or admin can delete their media
router.delete('/:id/media/:mediaId', requireAuth, async (req, res) => {
  const event = await Event.findById(req.params.id).select('createdBy media');
  if (!event) return res.status(404).json({ error: 'Event not found' });

  const isOwner = String(event.createdBy) === String(req.user._id);
  const isAdmin = req.user.role === 'admin';

  if (!isOwner && !isAdmin) {
    return res.status(403).json({ error: 'Only the event owner can remove media' });
  }

  await Event.findByIdAndUpdate(
    req.params.id,
    { $pull: { media: { id: req.params.mediaId } } },
  );

  res.json({ success: true });
});

// ── PATCH /api/events/:id ─────────────────────────────────
// Owner updates event details
router.patch('/:id', requireAuth, async (req, res) => {
  const event = await Event.findById(req.params.id).select('createdBy');
  if (!event) return res.status(404).json({ error: 'Event not found' });

  if (String(event.createdBy) !== String(req.user._id) && req.user.role !== 'admin') {
    return res.status(403).json({ error: 'Only the event owner can edit this event' });
  }

  const allowed = ['title', 'venue', 'city', 'date', 'time', 'category', 'vibes',
    'pricePerSeat', 'totalSeats', 'seatsLeft', 'hostNote', 'isActive'];
  const patch = {};
  for (const key of allowed) {
    if (key in req.body) patch[key] = req.body[key];
  }

  // Replace media when mediaUrls array provided
  if (Array.isArray(req.body.mediaUrls)) {
    patch.media = req.body.mediaUrls.map((url, idx) => ({
      id: `m-${Date.now()}-${idx}`,
      kind: url.includes('video') || url.endsWith('.mp4') || url.endsWith('.mov') ? 'video' : 'image',
      src: url,
      uploadedBy: String(req.user._id),
      status: 'approved',
      flags: 0,
    }));
  }

  const updated = await Event.findByIdAndUpdate(req.params.id, patch, { new: true });
  res.json(updated);
});

// ── DELETE /api/events/:id ────────────────────────────────
router.delete('/:id', requireAuth, async (req, res) => {
  const event = await Event.findById(req.params.id).select('createdBy');
  if (!event) return res.status(404).json({ error: 'Event not found' });

  if (String(event.createdBy) !== String(req.user._id) && req.user.role !== 'admin') {
    return res.status(403).json({ error: 'Only the event owner can delete this event' });
  }

  await Event.findByIdAndUpdate(req.params.id, { isActive: false });
  res.json({ success: true });
});

module.exports = router;
