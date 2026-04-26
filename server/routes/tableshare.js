const router = require('express').Router();
const mongoose = require('mongoose');
const { body, query, validationResult } = require('express-validator');
const { requireAuth } = require('../middleware/auth');
const Event = require('../models/Event');
const Booking = require('../models/Booking');
const Bookmark = require('../models/Bookmark');
const Stalk = require('../models/Stalk');
const UserInteraction = require('../models/UserInteraction');

const HOLD_MS = 60 * 60 * 1000;

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

function toIsoDate(input) {
  if (!input) return '';
  const str = String(input).trim();
  if (/^\d{4}-\d{2}-\d{2}$/.test(str)) return str;
  const dt = new Date(str);
  if (Number.isNaN(dt.getTime())) return '';
  return dt.toISOString().slice(0, 10);
}

async function countActiveBookingsForTable(eventId, tableId) {
  const now = new Date();
  const result = await Booking.aggregate([
    {
      $match: {
        eventId: String(eventId),
        tableId: String(tableId),
        $or: [
          { status: 'confirmed' },
          { status: 'held', expiresAt: { $gt: now } },
        ],
      },
    },
    { $group: { _id: null, total: { $sum: '$guests' } } },
  ]);
  return result[0]?.total ?? 0;
}

function parseGeminiJson(text) {
  if (!text) return null;
  const cleaned = String(text).replace(/```json|```/g, '').trim();
  try {
    return JSON.parse(cleaned);
  } catch {
    return null;
  }
}

async function rankWithGemini({ apiKey, profile, candidates }) {
  if (!apiKey) return null;

  const endpoint = `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${apiKey}`;
  const prompt = {
    system: 'You are a nightlife recommendation engine. Return strict JSON only.',
    user: {
      profile,
      candidates,
      instruction: 'Return JSON: {"orderedEventIds": string[], "rationale": {"<eventId>": "short reason"}}. Keep rationale under 18 words each.',
    },
  };

  const res = await fetch(endpoint, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      contents: [
        { role: 'user', parts: [{ text: JSON.stringify(prompt) }] },
      ],
      generationConfig: {
        temperature: 0.2,
        maxOutputTokens: 700,
        responseMimeType: 'application/json',
      },
    }),
  });

  if (!res.ok) return null;

  const data = await res.json();
  const text = data?.candidates?.[0]?.content?.parts?.[0]?.text;
  const parsed = parseGeminiJson(text);
  if (!parsed || !Array.isArray(parsed.orderedEventIds)) return null;
  return parsed;
}

async function buildStalkedUserEventMap(stalkerId) {
  const stalks = await Stalk.find({ stalker: stalkerId, targetType: 'user', targetUser: { $ne: null } })
    .select('targetUser')
    .lean();
  const userIds = stalks.map((s) => s.targetUser).filter(Boolean);
  if (!userIds.length) return new Map();

  const today = todayIso();
  const [hosted, bookings] = await Promise.all([
    Event.find({ createdBy: { $in: userIds }, isActive: true, date: { $gte: today } }).select('_id createdBy').lean(),
    Booking.find({ userId: { $in: userIds }, status: { $in: ['held', 'confirmed'] }, date: { $gte: today } })
      .select('userId eventId')
      .lean(),
  ]);

  const map = new Map();
  for (const e of hosted) {
    map.set(String(e._id), true);
  }
  for (const b of bookings) {
    if (mongoose.isValidObjectId(b.eventId)) map.set(String(b.eventId), true);
  }
  return map;
}

router.post('/interactions', requireAuth,
  body('action').isIn(['like', 'comment', 'share']),
  body('eventId').isString().notEmpty(),
  body('title').optional().isString(),
  body('venue').optional().isString(),
  body('city').optional().isString(),
  body('eventDate').optional().isString(),
  async (req, res) => {
    const errs = validationResult(req);
    if (!errs.isEmpty()) return res.status(400).json({ error: errs.array()[0].msg });

    const payload = {
      userId: req.user._id,
      action: req.body.action,
      eventId: String(req.body.eventId),
      title: req.body.title || '',
      venue: req.body.venue || '',
      city: req.body.city || '',
      eventDate: toIsoDate(req.body.eventDate),
      metadata: req.body.metadata && typeof req.body.metadata === 'object' ? req.body.metadata : {},
    };

    const interaction = await UserInteraction.create(payload);
    res.status(201).json({ id: String(interaction._id) });
  }
);

router.get('/personalized', requireAuth,
  query('date').optional().isString(),
  query('autoBook').optional().isIn(['0', '1']),
  async (req, res) => {
    const errs = validationResult(req);
    if (!errs.isEmpty()) return res.status(400).json({ error: errs.array()[0].msg });

    const selectedDate = toIsoDate(req.query.date);
    const today = todayIso();
    const dateFloor = selectedDate || today;

    const [events, bookmarks, interactions, stalks, confirmedBookings, stalkedUserEventMap] = await Promise.all([
      Event.find({ isActive: true, date: { $gte: dateFloor } })
        .select('_id title venue city date time category vibes media pricePerSeat seatsLeft totalSeats hostNote tables createdBy')
        .sort({ date: 1, createdAt: -1 })
        .limit(80)
        .lean(),
      Bookmark.find({ userId: req.user._id }).select('refId type title city').lean(),
      UserInteraction.find({ userId: req.user._id, createdAt: { $gte: new Date(Date.now() - 1000 * 60 * 60 * 24 * 90) } })
        .select('eventId action venue city')
        .lean(),
      Stalk.find({ stalker: req.user._id }).lean(),
      Booking.find({ userId: req.user._id, status: { $in: ['held', 'confirmed'] } })
        .select('eventId date city venue status')
        .lean(),
      buildStalkedUserEventMap(req.user._id),
    ]);

    const bookmarkedEventIds = new Set(bookmarks.filter((b) => b.type === 'event').map((b) => String(b.refId)));
    const bookmarkedVenues = new Set(bookmarks.filter((b) => b.type === 'venue').map((b) => venueKey(b.title || b.refId)));
    const interactionByEvent = new Map();
    for (const it of interactions) {
      const key = String(it.eventId);
      const prev = interactionByEvent.get(key) || { like: 0, comment: 0, share: 0 };
      prev[it.action] = (prev[it.action] || 0) + 1;
      interactionByEvent.set(key, prev);
    }

    const stalkedEstablishments = new Set(
      stalks.filter((s) => s.targetType === 'establishment' && s.establishmentKey).map((s) => s.establishmentKey)
    );

    const beenToVenues = new Set(
      confirmedBookings
        .filter((b) => b.status === 'confirmed')
        .map((b) => venueKey(b.venue || ''))
        .filter(Boolean)
    );

    const busyDates = new Set(confirmedBookings.filter((b) => b.status === 'confirmed').map((b) => toIsoDate(b.date)).filter(Boolean));

    const userVibes = Array.isArray(req.user.vibes) ? req.user.vibes.map((v) => String(v).toLowerCase()) : [];
    const userCity = String(req.user.city || '').toLowerCase();

    const scored = events.map((e) => {
      const id = String(e._id);
      const interactionsForEvent = interactionByEvent.get(id) || { like: 0, comment: 0, share: 0 };
      const eventVibes = Array.isArray(e.vibes) ? e.vibes.map((v) => String(v).toLowerCase()) : [];
      const vibeHits = eventVibes.filter((v) => userVibes.includes(v)).length;
      const cityMatch = userCity && String(e.city || '').toLowerCase().includes(userCity) ? 1 : 0;
      const venueK = venueKey(e.venue || '');

      let score = 0;
      score += vibeHits * 10;
      score += cityMatch ? 22 : 0;
      score += bookmarkedEventIds.has(id) ? 25 : 0;
      score += interactionsForEvent.like * 12;
      score += interactionsForEvent.comment * 14;
      score += interactionsForEvent.share * 10;
      score += stalkedEstablishments.has(venueK) ? 24 : 0;
      score += bookmarkedVenues.has(venueK) ? 14 : 0;
      score += beenToVenues.has(venueK) ? 10 : 0;
      score += stalkedUserEventMap.has(id) ? 36 : 0;

      return {
        eventId: id,
        score,
        reasons: {
          vibeHits,
          cityMatch,
          bookmarkedEvent: bookmarkedEventIds.has(id),
          likeCount: interactionsForEvent.like,
          commentCount: interactionsForEvent.comment,
          shareCount: interactionsForEvent.share,
          stalkedEstablishment: stalkedEstablishments.has(venueK),
          beenToVenue: beenToVenues.has(venueK),
          stalkedUserMatch: stalkedUserEventMap.has(id),
        },
        event: e,
      };
    });

    scored.sort((a, b) => b.score - a.score);

    const geminiResult = await rankWithGemini({
      apiKey: process.env.GEMINI_API_KEY,
      profile: {
        city: req.user.city || null,
        vibes: req.user.vibes || [],
        stalkedUsers: stalks.filter((s) => s.targetType === 'user').length,
        stalkedEstablishments: stalks.filter((s) => s.targetType === 'establishment').map((s) => s.establishmentName || s.establishmentKey),
        beenToVenues: Array.from(beenToVenues),
      },
      candidates: scored.slice(0, 20).map((s) => ({
        eventId: s.eventId,
        title: s.event.title,
        venue: s.event.venue,
        city: s.event.city,
        date: s.event.date,
        vibes: s.event.vibes,
        score: s.score,
      })),
    });

    let ordered = scored;
    const rationaleById = {};

    if (geminiResult?.orderedEventIds?.length) {
      const rank = new Map(geminiResult.orderedEventIds.map((id, i) => [String(id), i]));
      ordered = [...scored].sort((a, b) => {
        const ar = rank.has(a.eventId) ? rank.get(a.eventId) : 9999;
        const br = rank.has(b.eventId) ? rank.get(b.eventId) : 9999;
        if (ar !== br) return ar - br;
        return b.score - a.score;
      });
      Object.assign(rationaleById, geminiResult.rationale || {});
    }

    let autoBooked = null;

    if (String(req.query.autoBook || '0') === '1') {
      const candidate = ordered.find((s) => {
        const date = toIsoDate(s.event.date);
        const closeCity = userCity && String(s.event.city || '').toLowerCase().includes(userCity);
        return s.reasons.stalkedUserMatch && closeCity && date && !busyDates.has(date);
      });

      if (candidate && mongoose.isValidObjectId(candidate.eventId)) {
        const existing = await Booking.findOne({
          userId: req.user._id,
          eventId: candidate.eventId,
          status: { $in: ['held', 'confirmed'] },
        }).select('_id').lean();

        if (!existing) {
          const eventDoc = candidate.event;
          const tables = Array.isArray(eventDoc.tables) ? eventDoc.tables : [];
          let selectedTable = null;

          for (const t of tables) {
            const taken = await countActiveBookingsForTable(candidate.eventId, t.id);
            const available = Math.max(0, Number(t.capacity || 0) - Number(t.taken || 0) - taken);
            if (available >= 1) {
              selectedTable = t;
              break;
            }
          }

          if (selectedTable) {
            const now = Date.now();
            const booking = await Booking.create({
              userId: req.user._id,
              eventId: candidate.eventId,
              eventTitle: eventDoc.title,
              eventImage: Array.isArray(eventDoc.media) && eventDoc.media[0]?.src ? eventDoc.media[0].src : '',
              venue: eventDoc.venue || '',
              city: eventDoc.city || '',
              date: eventDoc.date,
              time: eventDoc.time || '',
              tableId: selectedTable.id,
              tableLabel: selectedTable.label,
              guests: 1,
              pricePerSeat: Number(eventDoc.pricePerSeat || 0),
              total: Number(eventDoc.pricePerSeat || 0),
              heldAt: new Date(now),
              expiresAt: new Date(now + HOLD_MS),
              status: 'confirmed',
              confirmedAt: new Date(now),
              notes: 'Auto-booked by Gemini stalk priority matching',
            });

            autoBooked = {
              bookingId: String(booking._id),
              eventId: candidate.eventId,
              title: eventDoc.title,
              date: eventDoc.date,
              city: eventDoc.city,
              tableLabel: selectedTable.label,
            };
          }
        }
      }
    }

    res.json({
      recommendations: ordered.slice(0, 30).map((s) => ({
        eventId: s.eventId,
        score: s.score,
        rationale: rationaleById[s.eventId] || '',
        stalkPriority: Boolean(s.reasons.stalkedUserMatch),
        event: {
          id: s.eventId,
          title: s.event.title,
          venue: s.event.venue,
          city: s.event.city,
          date: s.event.date,
          dateISO: toIsoDate(s.event.date),
          time: s.event.time || '',
          category: s.event.category,
          vibes: Array.isArray(s.event.vibes) ? s.event.vibes : [],
          image: Array.isArray(s.event.media) && s.event.media[0]?.src ? s.event.media[0].src : '',
          pricePerSeat: Number(s.event.pricePerSeat || 0),
          seatsLeft: Number(s.event.seatsLeft || 0),
          totalSeats: Number(s.event.totalSeats || 0),
          hostNote: s.event.hostNote || '',
          sharers: [],
          trending: false,
          surge: false,
        },
      })),
      autoBooked,
      aiEnabled: Boolean(process.env.GEMINI_API_KEY),
    });
  }
);

module.exports = router;
