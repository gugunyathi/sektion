const router = require('express').Router();
const mongoose = require('mongoose');
const { query, body, validationResult } = require('express-validator');
const { requireAuth, optionalAuth } = require('../middleware/auth');
const Stalk = require('../models/Stalk');
const User = require('../models/User');
const Event = require('../models/Event');
const Booking = require('../models/Booking');

function venueKey(raw = '') {
  return String(raw)
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

function todayIso() {
  return new Date().toISOString().slice(0, 10);
}

async function buildUserCalendarEntries(userId) {
  const today = todayIso();
  const [hostedEvents, bookings] = await Promise.all([
    Event.find({ isActive: true, createdBy: userId, date: { $gte: today } })
      .select('_id title venue city date time category media createdBy createdAt')
      .lean(),
    Booking.find({ userId, status: { $in: ['held', 'confirmed'] }, date: { $gte: today } })
      .sort({ date: 1 })
      .lean(),
  ]);

  const eventIds = bookings
    .map((b) => b.eventId)
    .filter((id) => mongoose.isValidObjectId(id));

  const bookedEvents = eventIds.length
    ? await Event.find({ _id: { $in: eventIds }, isActive: true })
      .select('_id title venue city date time category media createdBy createdAt')
      .lean()
    : [];

  const byId = new Map(bookedEvents.map((e) => [String(e._id), e]));

  const attending = bookings.map((b) => {
    const match = mongoose.isValidObjectId(b.eventId) ? byId.get(String(b.eventId)) : null;
    return {
      source: 'attending',
      sourceUserId: String(userId),
      bookingId: String(b._id),
      eventId: match ? String(match._id) : String(b.eventId),
      title: match?.title ?? b.eventTitle,
      venue: match?.venue ?? b.venue,
      city: match?.city ?? b.city,
      date: match?.date ?? b.date,
      time: match?.time ?? b.time,
      category: match?.category,
      image: Array.isArray(match?.media) && match.media.length ? match.media[0].src : b.eventImage,
      status: b.status,
    };
  });

  const hosted = hostedEvents.map((e) => ({
    source: 'hosting',
    sourceUserId: String(userId),
    eventId: String(e._id),
    title: e.title,
    venue: e.venue,
    city: e.city,
    date: e.date,
    time: e.time,
    category: e.category,
    image: Array.isArray(e.media) && e.media.length ? e.media[0].src : null,
    status: 'confirmed',
  }));

  return [...attending, ...hosted];
}

router.get('/discover/users', optionalAuth,
  query('q').optional().isString(),
  query('limit').optional().isInt({ min: 1, max: 50 }),
  async (req, res) => {
    const errs = validationResult(req);
    if (!errs.isEmpty()) return res.status(400).json({ error: errs.array()[0].msg });

    const q = String(req.query.q || '').trim();
    const limit = Number(req.query.limit || 20);

    const filter = {
      ...(req.user ? { _id: { $ne: req.user._id } } : {}),
      profileComplete: true,
      ...(q
        ? {
            $or: [
              { username: { $regex: new RegExp(q, 'i') } },
              { displayName: { $regex: new RegExp(q, 'i') } },
              { city: { $regex: new RegExp(q, 'i') } },
            ],
          }
        : {}),
    };

    const usersPromise = User.find(filter)
      .select('_id username displayName photoURL city vibes bio')
      .sort({ createdAt: -1 })
      .limit(limit)
      .lean();

    const stalksPromise = req.user
      ? Stalk.find({ stalker: req.user._id, targetType: 'user' }).select('targetUser').lean()
      : Promise.resolve([]);

    const [users, stalks] = await Promise.all([usersPromise, stalksPromise]);

    const stalkedIds = new Set(stalks.map((s) => String(s.targetUser)));

    res.json({
      users: users.map((u) => ({
        id: String(u._id),
        username: u.username,
        displayName: u.displayName,
        photoURL: u.photoURL,
        city: u.city,
        vibes: u.vibes || [],
        bio: u.bio || '',
        stalking: stalkedIds.has(String(u._id)),
      })),
    });
  }
);

router.get('/discover/establishments', optionalAuth,
  query('q').optional().isString(),
  query('limit').optional().isInt({ min: 1, max: 100 }),
  async (req, res) => {
    const q = String(req.query.q || '').trim();
    const limit = Number(req.query.limit || 30);
    const today = todayIso();

    const events = await Event.find({ isActive: true, date: { $gte: today } })
      .select('venue city date')
      .sort({ date: 1 })
      .limit(500)
      .lean();

    const grouped = new Map();
    for (const e of events) {
      const key = venueKey(e.venue);
      if (!key) continue;
      if (q && !(`${e.venue} ${e.city}`.toLowerCase().includes(q.toLowerCase()))) continue;
      const prev = grouped.get(key) || { key, name: e.venue, city: e.city || '', upcomingCount: 0, nextDate: e.date };
      prev.upcomingCount += 1;
      if (!prev.nextDate || String(e.date) < String(prev.nextDate)) prev.nextDate = e.date;
      grouped.set(key, prev);
    }

    const stalks = req.user
      ? await Stalk.find({ stalker: req.user._id, targetType: 'establishment' })
        .select('establishmentKey')
        .lean()
      : [];
    const stalkedKeys = new Set(stalks.map((s) => s.establishmentKey));

    const establishments = Array.from(grouped.values())
      .slice(0, limit)
      .map((e) => ({ ...e, stalking: stalkedKeys.has(e.key) }));

    res.json({ establishments });
  }
);

router.post('/users/:userId', requireAuth, async (req, res) => {
  const { userId } = req.params;
  if (!mongoose.isValidObjectId(userId)) return res.status(400).json({ error: 'Invalid user id' });
  if (String(userId) === String(req.user._id)) return res.status(400).json({ error: 'Cannot stalk yourself' });

  const exists = await User.findById(userId).select('_id').lean();
  if (!exists) return res.status(404).json({ error: 'User not found' });

  await Stalk.updateOne(
    { stalker: req.user._id, targetType: 'user', targetUser: userId },
    { $setOnInsert: { stalker: req.user._id, targetType: 'user', targetUser: userId } },
    { upsert: true }
  );

  res.status(201).json({ ok: true });
});

router.delete('/users/:userId', requireAuth, async (req, res) => {
  const { userId } = req.params;
  if (!mongoose.isValidObjectId(userId)) return res.status(400).json({ error: 'Invalid user id' });

  await Stalk.deleteOne({ stalker: req.user._id, targetType: 'user', targetUser: userId });
  res.json({ ok: true });
});

router.post('/establishments', requireAuth,
  body('name').isString().trim().notEmpty(),
  body('city').optional().isString().trim(),
  async (req, res) => {
    const errs = validationResult(req);
    if (!errs.isEmpty()) return res.status(400).json({ error: errs.array()[0].msg });

    const name = String(req.body.name).trim();
    const city = String(req.body.city || '').trim();
    const key = venueKey(name);

    if (!key) return res.status(400).json({ error: 'Invalid establishment name' });

    await Stalk.updateOne(
      { stalker: req.user._id, targetType: 'establishment', establishmentKey: key },
      {
        $setOnInsert: {
          stalker: req.user._id,
          targetType: 'establishment',
          establishmentKey: key,
          establishmentName: name,
          establishmentCity: city,
        },
      },
      { upsert: true }
    );

    res.status(201).json({ ok: true, key });
  }
);

router.delete('/establishments/:key', requireAuth, async (req, res) => {
  const key = venueKey(req.params.key);
  if (!key) return res.status(400).json({ error: 'Invalid establishment key' });

  await Stalk.deleteOne({ stalker: req.user._id, targetType: 'establishment', establishmentKey: key });
  res.json({ ok: true });
});

router.get('/me', requireAuth, async (req, res) => {
  const stalks = await Stalk.find({ stalker: req.user._id }).lean();
  const userIds = stalks.filter((s) => s.targetType === 'user' && s.targetUser).map((s) => s.targetUser);

  const users = userIds.length
    ? await User.find({ _id: { $in: userIds } })
      .select('_id username displayName photoURL city vibes')
      .lean()
    : [];

  const userById = new Map(users.map((u) => [String(u._id), u]));

  const stalkingUsers = stalks
    .filter((s) => s.targetType === 'user' && s.targetUser)
    .map((s) => {
      const u = userById.get(String(s.targetUser));
      return u
        ? {
            id: String(u._id),
            username: u.username,
            displayName: u.displayName,
            photoURL: u.photoURL,
            city: u.city,
            vibes: u.vibes || [],
          }
        : null;
    })
    .filter(Boolean);

  const stalkingEstablishments = stalks
    .filter((s) => s.targetType === 'establishment')
    .map((s) => ({
      key: s.establishmentKey,
      name: s.establishmentName,
      city: s.establishmentCity,
    }));

  res.json({ stalkingUsers, stalkingEstablishments });
});

router.get('/calendars/me', requireAuth,
  query('view').optional().isIn(['my', 'stalk']),
  async (req, res) => {
    const view = String(req.query.view || 'my');
    const today = todayIso();

    const myEntries = await buildUserCalendarEntries(req.user._id);
    const results = [...myEntries];

    if (view === 'stalk') {
      const stalks = await Stalk.find({ stalker: req.user._id }).lean();
      const stalkedUserIds = stalks
        .filter((s) => s.targetType === 'user' && s.targetUser)
        .map((s) => s.targetUser);

      const stalkedEstablishmentKeys = new Set(
        stalks
          .filter((s) => s.targetType === 'establishment' && s.establishmentKey)
          .map((s) => s.establishmentKey)
      );

      if (stalkedUserIds.length) {
        const userCalendars = await Promise.all(stalkedUserIds.map((id) => buildUserCalendarEntries(id)));
        results.push(...userCalendars.flat().map((e) => ({ ...e, source: `stalked_${e.source}` })));
      }

      if (stalkedEstablishmentKeys.size) {
        const futureEvents = await Event.find({ isActive: true, date: { $gte: today } })
          .select('_id title venue city date time category media createdBy')
          .sort({ date: 1 })
          .limit(1000)
          .lean();

        for (const e of futureEvents) {
          const key = venueKey(e.venue);
          if (!key || !stalkedEstablishmentKeys.has(key)) continue;
          results.push({
            source: 'stalked_establishment',
            establishmentKey: key,
            eventId: String(e._id),
            title: e.title,
            venue: e.venue,
            city: e.city,
            date: e.date,
            time: e.time,
            category: e.category,
            image: Array.isArray(e.media) && e.media.length ? e.media[0].src : null,
            status: 'confirmed',
          });
        }
      }
    }

    results.sort((a, b) => {
      if (a.date !== b.date) return String(a.date).localeCompare(String(b.date));
      return String(a.time || '').localeCompare(String(b.time || ''));
    });

    res.json({ view, events: results });
  }
);

router.get('/calendars/users/:userId',
  async (req, res) => {
    const { userId } = req.params;
    if (!mongoose.isValidObjectId(userId)) return res.status(400).json({ error: 'Invalid user id' });

    const user = await User.findById(userId).select('_id username displayName photoURL city').lean();
    if (!user) return res.status(404).json({ error: 'User not found' });

    const events = await buildUserCalendarEntries(userId);
    events.sort((a, b) => {
      if (a.date !== b.date) return String(a.date).localeCompare(String(b.date));
      return String(a.time || '').localeCompare(String(b.time || ''));
    });

    res.json({
      user: {
        id: String(user._id),
        username: user.username,
        displayName: user.displayName,
        photoURL: user.photoURL,
        city: user.city,
      },
      events,
    });
  }
);

module.exports = router;
