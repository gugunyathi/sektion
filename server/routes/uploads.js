const router = require('express').Router();
const path = require('path');
const fs = require('fs');
const { requireAuth } = require('../middleware/auth');
const { uploadAvatar, uploadMedia, uploadItem, toPublicUrl } = require('../middleware/upload');
const Media = require('../models/Media');
const User = require('../models/User');

// ── POST /api/uploads/avatar ─────────────────────────────
router.post('/avatar', requireAuth, uploadAvatar.single('file'), async (req, res) => {
  if (!req.file) return res.status(400).json({ error: 'No file uploaded' });

  const relPath = `avatars/${req.file.filename}`;
  const url = toPublicUrl(req, relPath);

  // Delete old avatar file if it was a local upload
  if (req.user.photoURL?.includes('/uploads/avatars/')) {
    const old = path.join(__dirname, '../uploads', req.user.photoURL.split('/uploads/')[1]);
    if (fs.existsSync(old)) fs.unlinkSync(old);
  }

  await User.findByIdAndUpdate(req.user._id, { photoURL: url });
  res.json({ url });
});

// ── POST /api/uploads/media ──────────────────────────────
router.post('/media', requireAuth, uploadMedia.single('file'), async (req, res) => {
  if (!req.file) return res.status(400).json({ error: 'No file uploaded' });

  const { eventId, caption } = req.body;
  if (!eventId) return res.status(400).json({ error: 'eventId required' });

  const kind = req.file.mimetype.startsWith('video/') ? 'video' : 'image';
  const relPath = `media/${req.file.filename}`;
  const url = toPublicUrl(req, relPath);

  const media = await Media.create({
    userId:  req.user._id,
    eventId,
    url,
    kind,
    caption,
    status: 'pending',
  });

  res.status(201).json({
    id:      media._id,
    url,
    kind,
    caption: media.caption,
    status:  media.status,
    eventId,
  });
});

// ── POST /api/uploads/sektion-media ──────────────────────
router.post('/sektion-media', requireAuth, uploadMedia.single('file'), async (req, res) => {
  if (!req.file) return res.status(400).json({ error: 'No file uploaded' });

  const kind = req.file.mimetype.startsWith('video/') ? 'video' : 'image';
  const relPath = `media/${req.file.filename}`;
  const url = toPublicUrl(req, relPath);

  res.status(201).json({ url, kind });
});

// ── POST /api/uploads/item ───────────────────────────────
router.post('/item', requireAuth, uploadItem.single('file'), async (req, res) => {
  if (!req.file) return res.status(400).json({ error: 'No file uploaded' });
  const url = toPublicUrl(req, `items/${req.file.filename}`);
  res.json({ url });
});

// ── DELETE /api/uploads/media/:id ───────────────────────
router.delete('/media/:id', requireAuth, async (req, res) => {
  const media = await Media.findOne({ _id: req.params.id });
  if (!media) return res.status(404).json({ error: 'Not found' });

  const isOwner = media.userId.toString() === req.user._id.toString();
  const isAdmin = req.user.isAdmin;
  if (!isOwner && !isAdmin) return res.status(403).json({ error: 'Forbidden' });

  // Remove file from disk
  if (media.url?.includes('/uploads/')) {
    const rel = media.url.split('/uploads/')[1];
    const filePath = path.join(__dirname, '../uploads', rel);
    if (fs.existsSync(filePath)) fs.unlinkSync(filePath);
  }

  await Media.findByIdAndDelete(req.params.id);
  res.json({ message: 'Deleted' });
});

// ── POST /api/uploads/media/:id/flag ────────────────────
router.post('/media/:id/flag', requireAuth, async (req, res) => {
  const media = await Media.findById(req.params.id);
  if (!media) return res.status(404).json({ error: 'Not found' });

  const alreadyFlagged = media.flaggedBy.includes(req.user._id);
  if (!alreadyFlagged) {
    media.flaggedBy.push(req.user._id);
    media.flags = media.flaggedBy.length;
    // Auto-freeze at 5+ flags
    if (media.flags >= 5 && media.status !== 'frozen') {
      media.status = 'frozen';
    }
    await media.save();
  }

  res.json({ flags: media.flags, status: media.status });
});

module.exports = router;
