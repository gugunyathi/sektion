const router = require('express').Router();
const { requireAuth, requireAdmin } = require('../middleware/auth');
const Media = require('../models/Media');
const User = require('../models/User');
const Session = require('../models/Session');

router.use(requireAuth, requireAdmin);

// ── GET /api/admin/media ─────────────────────────────────
router.get('/media', async (req, res) => {
  const { status = 'pending', page = 1, limit = 30 } = req.query;
  const skip = (Number(page) - 1) * Number(limit);
  const [items, total] = await Promise.all([
    Media.find({ status })
      .populate('userId', 'username displayName photoURL')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(Number(limit)),
    Media.countDocuments({ status }),
  ]);
  res.json({ items, total });
});

// ── PATCH /api/admin/media/:id/approve ──────────────────
router.patch('/media/:id/approve', async (req, res) => {
  const media = await Media.findByIdAndUpdate(
    req.params.id,
    { status: 'approved', reviewedBy: req.user._id, reviewedAt: new Date() },
    { new: true }
  );
  if (!media) return res.status(404).json({ error: 'Not found' });
  res.json(media);
});

// ── PATCH /api/admin/media/:id/freeze ───────────────────
router.patch('/media/:id/freeze', async (req, res) => {
  const media = await Media.findByIdAndUpdate(
    req.params.id,
    {
      status: 'frozen',
      reviewedBy: req.user._id,
      reviewedAt: new Date(),
      freezeReason: req.body.reason || 'Admin review',
    },
    { new: true }
  );
  if (!media) return res.status(404).json({ error: 'Not found' });
  res.json(media);
});

// ── DELETE /api/admin/media/:id ──────────────────────────
router.delete('/media/:id', async (req, res) => {
  const media = await Media.findByIdAndDelete(req.params.id);
  if (!media) return res.status(404).json({ error: 'Not found' });
  res.json({ message: 'Deleted' });
});

// ── GET /api/admin/users ─────────────────────────────────
router.get('/users', async (req, res) => {
  const { q, page = 1, limit = 30, banned } = req.query;
  const filter = {};
  if (q) filter.$or = [
    { username: { $regex: new RegExp(q, 'i') } },
    { email:    { $regex: new RegExp(q, 'i') } },
    { phone:    { $regex: new RegExp(q, 'i') } },
  ];
  if (banned === 'true')  filter.isBanned = true;
  if (banned === 'false') filter.isBanned = { $ne: true };

  const skip = (Number(page) - 1) * Number(limit);
  const [users, total] = await Promise.all([
    User.find(filter).select('-__v').sort({ createdAt: -1 }).skip(skip).limit(Number(limit)),
    User.countDocuments(filter),
  ]);
  res.json({ users, total });
});

// ── PATCH /api/admin/users/:id/ban ──────────────────────
router.patch('/users/:id/ban', async (req, res) => {
  const { reason = 'Violation of community guidelines' } = req.body;
  const user = await User.findByIdAndUpdate(
    req.params.id,
    { isBanned: true, bannedAt: new Date(), banReason: reason },
    { new: true }
  );
  if (!user) return res.status(404).json({ error: 'User not found' });
  // Revoke all sessions
  await Session.updateMany({ userId: user._id, revokedAt: null }, { revokedAt: new Date() });
  res.json(user.toPublicJSON());
});

// ── PATCH /api/admin/users/:id/unban ────────────────────
router.patch('/users/:id/unban', async (req, res) => {
  const user = await User.findByIdAndUpdate(
    req.params.id,
    { isBanned: false, $unset: { banReason: 1, bannedAt: 1 } },
    { new: true }
  );
  if (!user) return res.status(404).json({ error: 'User not found' });
  res.json(user.toPublicJSON());
});

// ── PATCH /api/admin/users/:id/make-admin ───────────────
router.patch('/users/:id/make-admin', async (req, res) => {
  const user = await User.findByIdAndUpdate(req.params.id, { isAdmin: true }, { new: true });
  if (!user) return res.status(404).json({ error: 'User not found' });
  res.json(user.toPublicJSON());
});

module.exports = router;
