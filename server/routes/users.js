const router = require('express').Router();
const { body, validationResult } = require('express-validator');
const User = require('../models/User');
const { requireAuth } = require('../middleware/auth');

// ── GET /api/users/me ────────────────────────────────────
router.get('/me', requireAuth, (req, res) => {
  res.json(req.user.toPublicJSON());
});

// ── PATCH /api/users/me ──────────────────────────────────
router.patch('/me', requireAuth,
  body('username').optional().matches(/^[a-z0-9._]{3,30}$/).withMessage('Invalid username format'),
  body('displayName').optional().isLength({ max: 60 }),
  body('bio').optional().isLength({ max: 240 }),
  body('city').optional().isLength({ max: 60 }),
  body('vibes').optional().isArray({ max: 5 }),
  async (req, res) => {
    const errs = validationResult(req);
    if (!errs.isEmpty()) return res.status(400).json({ error: errs.array()[0].msg });

    const { username, displayName, bio, city, vibes } = req.body;
    const update = {};

    if (username !== undefined) {
      // Check uniqueness
      const existing = await User.findOne({ username, _id: { $ne: req.user._id } });
      if (existing) return res.status(409).json({ error: 'Username already taken' });
      update.username = username.toLowerCase();
    }
    if (displayName !== undefined) update.displayName = displayName;
    if (bio !== undefined) update.bio = bio;
    if (city !== undefined) update.city = city;
    if (vibes !== undefined) update.vibes = vibes;

    // Mark profile complete if username is set
    const finalUsername = username ?? req.user.username;
    if (finalUsername) update.profileComplete = true;

    const user = await User.findByIdAndUpdate(req.user._id, update, { new: true });
    res.json(user.toPublicJSON());
  }
);

// ── GET /api/users/check-username/:username ──────────────
router.get('/check-username/:username', requireAuth, async (req, res) => {
  const { username } = req.params;
  if (!/^[a-z0-9._]{3,30}$/.test(username)) {
    return res.status(400).json({ available: false, error: 'Invalid username format' });
  }
  const existing = await User.findOne({ username: username.toLowerCase(), _id: { $ne: req.user._id } });
  res.json({ available: !existing });
});

// ── DELETE /api/users/me ─────────────────────────────────
router.delete('/me', requireAuth, async (req, res) => {
  // Soft-delete: we keep the record but clear PII
  await User.findByIdAndUpdate(req.user._id, {
    email: null,
    phone: null,
    googleId: null,
    displayName: '[deleted]',
    username: null,
    photoURL: null,
    bio: null,
    isBanned: true,
    banReason: 'Account deleted by user',
  });
  res.json({ message: 'Account deleted' });
});

// ── GET /api/users/:id/public ────────────────────────────
router.get('/:id/public', async (req, res) => {
  const user = await User.findById(req.params.id).select('username displayName photoURL city vibes bio createdAt');
  if (!user) return res.status(404).json({ error: 'User not found' });
  res.json(user);
});

module.exports = router;
