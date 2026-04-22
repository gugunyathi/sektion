const router = require('express').Router();
const { body, validationResult } = require('express-validator');
const Bookmark = require('../models/Bookmark');
const { requireAuth } = require('../middleware/auth');

// ── GET /api/bookmarks ───────────────────────────────────
router.get('/', requireAuth, async (req, res) => {
  const bookmarks = await Bookmark.find({ userId: req.user._id }).sort({ createdAt: -1 }).lean();
  res.json(bookmarks.map((b) => ({ ...b, id: b._id.toString(), savedAt: new Date(b.createdAt).getTime() })));
});

// ── POST /api/bookmarks ──────────────────────────────────
router.post('/', requireAuth,
  body('type').isIn(['event', 'venue', 'table']),
  body('refId').notEmpty(),
  async (req, res) => {
    const errs = validationResult(req);
    if (!errs.isEmpty()) return res.status(400).json({ error: errs.array()[0].msg });

    const { type, refId, title, subtitle, image, city } = req.body;
    const bookmark = await Bookmark.findOneAndUpdate(
      { userId: req.user._id, refId },
      { userId: req.user._id, type, refId, title, subtitle, image, city },
      { upsert: true, new: true }
    );
    res.status(201).json({ ...bookmark.toObject(), id: bookmark._id.toString(), savedAt: new Date(bookmark.createdAt).getTime() });
  }
);

// ── DELETE /api/bookmarks/:refId ─────────────────────────
router.delete('/:refId', requireAuth, async (req, res) => {
  await Bookmark.deleteOne({ userId: req.user._id, refId: req.params.refId });
  res.json({ message: 'Removed' });
});

// ── DELETE /api/bookmarks ────────────────────────────────
router.delete('/', requireAuth, async (req, res) => {
  await Bookmark.deleteMany({ userId: req.user._id });
  res.json({ message: 'All bookmarks cleared' });
});

module.exports = router;
