const router = require('express').Router();
const { body, validationResult } = require('express-validator');
const Booking = require('../models/Booking');
const { requireAuth } = require('../middleware/auth');

const HOLD_MS = 60 * 60 * 1000; // 1 hour

// ── GET /api/bookings ────────────────────────────────────
router.get('/', requireAuth, async (req, res) => {
  const bookings = await Booking.find({ userId: req.user._id })
    .sort({ createdAt: -1 })
    .lean();

  // Auto-expire stale holds
  const now = new Date();
  const updated = bookings.map((b) => {
    if (b.status === 'held' && new Date(b.expiresAt) <= now) {
      Booking.findByIdAndUpdate(b._id, { status: 'expired' }).exec();
      return { ...b, status: 'expired' };
    }
    return b;
  });

  res.json(updated.map(formatBooking));
});

// ── GET /api/bookings/:id ────────────────────────────────
router.get('/:id', requireAuth, async (req, res) => {
  const booking = await Booking.findOne({ _id: req.params.id, userId: req.user._id });
  if (!booking) return res.status(404).json({ error: 'Booking not found' });
  res.json(formatBooking(booking));
});

// ── POST /api/bookings ───────────────────────────────────
router.post('/',
  requireAuth,
  body('eventId').notEmpty(),
  body('eventTitle').notEmpty(),
  body('tableId').notEmpty(),
  body('guests').isInt({ min: 1, max: 20 }),
  body('pricePerSeat').isFloat({ min: 0 }),
  body('date').matches(/^\d{4}-\d{2}-\d{2}$/),
  async (req, res) => {
    const errs = validationResult(req);
    if (!errs.isEmpty()) return res.status(400).json({ error: errs.array()[0].msg });

    const {
      eventId, eventTitle, eventImage, venue, city, date, time,
      tableId, tableLabel, guests, pricePerSeat,
    } = req.body;

    const now = Date.now();
    const booking = await Booking.create({
      userId: req.user._id,
      eventId, eventTitle, eventImage, venue, city, date, time,
      tableId, tableLabel, guests,
      pricePerSeat,
      total: pricePerSeat * guests,
      heldAt: new Date(now),
      expiresAt: new Date(now + HOLD_MS),
      status: 'held',
    });

    res.status(201).json(formatBooking(booking));
  }
);

// ── PATCH /api/bookings/:id/confirm ─────────────────────
router.patch('/:id/confirm', requireAuth, async (req, res) => {
  const booking = await Booking.findOne({ _id: req.params.id, userId: req.user._id });
  if (!booking) return res.status(404).json({ error: 'Booking not found' });
  if (booking.status !== 'held') return res.status(400).json({ error: `Cannot confirm a ${booking.status} booking` });
  if (new Date(booking.expiresAt) < new Date()) {
    booking.status = 'expired';
    await booking.save();
    return res.status(400).json({ error: 'Hold has expired' });
  }

  booking.status = 'confirmed';
  booking.confirmedAt = new Date();
  if (req.body.paymentRef) booking.paymentRef = req.body.paymentRef;
  if (req.body.paymentMethod) booking.paymentMethod = req.body.paymentMethod;
  await booking.save();
  res.json(formatBooking(booking));
});

// ── PATCH /api/bookings/:id/cancel ──────────────────────
router.patch('/:id/cancel', requireAuth, async (req, res) => {
  const booking = await Booking.findOne({ _id: req.params.id, userId: req.user._id });
  if (!booking) return res.status(404).json({ error: 'Booking not found' });
  if (!['held', 'confirmed'].includes(booking.status)) {
    return res.status(400).json({ error: `Cannot cancel a ${booking.status} booking` });
  }
  booking.status = 'cancelled';
  booking.cancelledAt = new Date();
  await booking.save();
  res.json(formatBooking(booking));
});

// ── PATCH /api/bookings/:id/reschedule ──────────────────
router.patch('/:id/reschedule', requireAuth,
  body('date').matches(/^\d{4}-\d{2}-\d{2}$/).withMessage('Invalid date'),
  async (req, res) => {
    const errs = validationResult(req);
    if (!errs.isEmpty()) return res.status(400).json({ error: errs.array()[0].msg });

    const booking = await Booking.findOne({ _id: req.params.id, userId: req.user._id });
    if (!booking) return res.status(404).json({ error: 'Booking not found' });
    if (booking.status !== 'confirmed') return res.status(400).json({ error: 'Only confirmed bookings can be rescheduled' });

    booking.date = req.body.date;
    booking.rescheduledAt = new Date();
    if (req.body.time) booking.time = req.body.time;
    await booking.save();
    res.json(formatBooking(booking));
  }
);

// ── PATCH /api/bookings/:id/upgrade ─────────────────────
router.patch('/:id/upgrade', requireAuth,
  body('tableId').notEmpty(),
  body('tableLabel').notEmpty(),
  body('total').isFloat({ min: 0 }),
  async (req, res) => {
    const errs = validationResult(req);
    if (!errs.isEmpty()) return res.status(400).json({ error: errs.array()[0].msg });

    const booking = await Booking.findOne({ _id: req.params.id, userId: req.user._id });
    if (!booking) return res.status(404).json({ error: 'Booking not found' });
    if (booking.status !== 'confirmed') return res.status(400).json({ error: 'Only confirmed bookings can be upgraded' });

    booking.tableId = req.body.tableId;
    booking.tableLabel = req.body.tableLabel;
    booking.total = req.body.total;
    await booking.save();
    res.json(formatBooking(booking));
  }
);

// ── PATCH /api/bookings/:id/notes ────────────────────────
router.patch('/:id/notes', requireAuth,
  body('notes').isLength({ max: 500 }),
  async (req, res) => {
    const booking = await Booking.findOneAndUpdate(
      { _id: req.params.id, userId: req.user._id },
      { notes: req.body.notes },
      { new: true }
    );
    if (!booking) return res.status(404).json({ error: 'Booking not found' });
    res.json(formatBooking(booking));
  }
);

// ── helper ───────────────────────────────────────────────
function formatBooking(b) {
  const obj = b.toObject ? b.toObject() : b;
  return {
    id:           obj._id?.toString() || obj.id,
    eventId:      obj.eventId,
    eventTitle:   obj.eventTitle,
    eventImage:   obj.eventImage || '',
    venue:        obj.venue || '',
    city:         obj.city || '',
    date:         obj.date,
    time:         obj.time || '',
    tableId:      obj.tableId,
    tableLabel:   obj.tableLabel || '',
    guests:       obj.guests,
    pricePerSeat: obj.pricePerSeat,
    total:        obj.total,
    heldAt:       new Date(obj.heldAt).getTime(),
    expiresAt:    new Date(obj.expiresAt).getTime(),
    confirmedAt:  obj.confirmedAt ? new Date(obj.confirmedAt).getTime() : undefined,
    cancelledAt:  obj.cancelledAt ? new Date(obj.cancelledAt).getTime() : undefined,
    status:       obj.status,
    notes:        obj.notes,
  };
}

module.exports = router;
