const router = require('express').Router();
const bcrypt = require('bcryptjs');
const { OAuth2Client } = require('google-auth-library');
const jwt = require('jsonwebtoken');
const { body, validationResult } = require('express-validator');

const User = require('../models/User');
const Session = require('../models/Session');
const OtpCode = require('../models/OtpCode');
const { signAccess, signRefresh, REFRESH_SECRET } = require('../middleware/auth');

const googleClient = new OAuth2Client(process.env.GOOGLE_CLIENT_ID);

// ── helpers ─────────────────────────────────────────────
const REFRESH_TTL_MS = 7 * 24 * 60 * 60 * 1000;

async function issueTokens(user, req) {
  const access  = signAccess(user._id);
  const refresh = signRefresh(user._id);

  await Session.create({
    userId:    user._id,
    refreshToken: refresh,
    ipAddress: req.ip,
    userAgent: req.headers['user-agent'],
    expiresAt: new Date(Date.now() + REFRESH_TTL_MS),
  });

  await User.findByIdAndUpdate(user._id, { lastSeen: new Date() });
  return { accessToken: access, refreshToken: refresh, user: user.toPublicJSON() };
}

function sendOtpViaTwilio(phone, code) {
  const { TWILIO_ACCOUNT_SID, TWILIO_AUTH_TOKEN, TWILIO_PHONE_NUMBER } = process.env;
  if (!TWILIO_ACCOUNT_SID || !TWILIO_AUTH_TOKEN) {
    // Dev mode: log to console
    console.log(`[DEV OTP] ${phone} → ${code}`);
    return Promise.resolve();
  }
  const twilio = require('twilio')(TWILIO_ACCOUNT_SID, TWILIO_AUTH_TOKEN);
  return twilio.messages.create({
    body: `Your Sektion code is ${code}. Valid for 5 minutes.`,
    from: TWILIO_PHONE_NUMBER,
    to: phone,
  });
}

// ── POST /api/auth/google ────────────────────────────────
router.post('/google',
  body('idToken').optional(),
  body('accessToken').optional(),
  async (req, res) => {
    try {
      const { idToken, accessToken } = req.body;
      if (!idToken && !accessToken) {
        return res.status(400).json({ error: 'idToken or accessToken required' });
      }

      // Validate env vars
      if (!process.env.GOOGLE_CLIENT_ID) {
        console.error('Missing GOOGLE_CLIENT_ID environment variable');
        return res.status(500).json({ error: 'Server misconfiguration: Missing GOOGLE_CLIENT_ID' });
      }

      let googleId, email, name, picture;

      if (idToken) {
        // Verify ID token (server-side flow)
        let ticket;
        try {
          ticket = await googleClient.verifyIdToken({
            idToken,
            audience: process.env.GOOGLE_CLIENT_ID,
          });
        } catch (err) {
          console.error('Google ID token verification failed:', err.message);
          return res.status(401).json({ error: 'Invalid Google token' });
        }
        ({ sub: googleId, email, name, picture } = ticket.getPayload());
      } else {
        // Verify access token by fetching Google userinfo
        try {
          const r = await fetch(`https://www.googleapis.com/oauth2/v3/userinfo`, {
            headers: { Authorization: `Bearer ${accessToken}` },
          });
          if (!r.ok) {
            const errBody = await r.text();
            console.error('Google userinfo failed:', r.status, errBody);
            return res.status(401).json({ error: 'Invalid Google access token' });
          }
          const info = await r.json();
          googleId = info.sub;
          email = info.email;
          name = info.name;
          picture = info.picture;
        } catch (err) {
          console.error('Google access token verification failed:', err.message);
          return res.status(401).json({ error: 'Failed to verify Google access token' });
        }
      }

      let user = await User.findOne({ $or: [{ googleId }, ...(email ? [{ email }] : [])] });
      if (!user) {
        user = await User.create({
          googleId,
          email,
          displayName: name,
          photoURL: picture,
          provider: 'google',
        });
        console.log('Created new user:', user._id);
      } else if (!user.googleId) {
        user.googleId = googleId;
        if (picture && !user.photoURL) user.photoURL = picture;
        await user.save();
        console.log('Updated user with googleId:', user._id);
      }

      if (user.isBanned) return res.status(403).json({ error: 'Account suspended' });

      const tokens = await issueTokens(user, req);
      res.json(tokens);
    } catch (error) {
      console.error('Auth /google error:', error);
      res.status(500).json({ error: error.message || 'Internal server error' });
    }
  }
);

// ── POST /api/auth/send-otp ──────────────────────────────
router.post('/send-otp',
  body('phone').matches(/^\+[1-9]\d{7,14}$/).withMessage('Invalid phone number (E.164 format required)'),
  async (req, res) => {
    try {
      const errs = validationResult(req);
      if (!errs.isEmpty()) return res.status(400).json({ error: errs.array()[0].msg });

      const { phone } = req.body;

      // Throttle: max 3 OTP requests per phone per 10 minutes
      const recentCount = await OtpCode.countDocuments({
        phone,
        createdAt: { $gte: new Date(Date.now() - 10 * 60 * 1000) },
      });
      if (recentCount >= 3) {
        return res.status(429).json({ error: 'Too many OTP requests. Wait 10 minutes.' });
      }

      const code = String(Math.floor(100000 + Math.random() * 900000));
      const codeHash = await bcrypt.hash(code, 10);

      await OtpCode.create({
        phone,
        codeHash,
        expiresAt: new Date(Date.now() + 5 * 60 * 1000),
        ipAddress: req.ip,
      });

      await sendOtpViaTwilio(phone, code);
      res.json({ message: 'OTP sent', phone });
    } catch (error) {
      console.error('Auth /send-otp error:', error);
      res.status(500).json({ error: error.message || 'Internal server error' });
    }
  }
);

// ── POST /api/auth/verify-otp ────────────────────────────
router.post('/verify-otp',
  body('phone').matches(/^\+[1-9]\d{7,14}$/).withMessage('Invalid phone'),
  body('code').isLength({ min: 6, max: 6 }).isNumeric().withMessage('Invalid code'),
  async (req, res) => {
    try {
      const errs = validationResult(req);
      if (!errs.isEmpty()) return res.status(400).json({ error: errs.array()[0].msg });

      const { phone, code } = req.body;

      const otp = await OtpCode.findOne({
        phone,
        used: false,
        expiresAt: { $gt: new Date() },
      }).sort({ createdAt: -1 });

      if (!otp) return res.status(400).json({ error: 'No active OTP found. Request a new one.' });

      // Increment attempts
      otp.attempts += 1;
      if (otp.attempts > 5) {
        otp.used = true;
        await otp.save();
        return res.status(429).json({ error: 'Too many failed attempts. Request a new code.' });
      }

      const valid = await bcrypt.compare(code, otp.codeHash);
      if (!valid) {
        await otp.save();
        return res.status(400).json({ error: 'Invalid code', attemptsLeft: 5 - otp.attempts });
      }

      otp.used = true;
      await otp.save();

      let user = await User.findOne({ phone });
      if (!user) {
        user = await User.create({ phone, provider: 'phone' });
      }

      if (user.isBanned) return res.status(403).json({ error: 'Account suspended' });

      const tokens = await issueTokens(user, req);
      res.json(tokens);
    } catch (error) {
      console.error('Auth /verify-otp error:', error);
      res.status(500).json({ error: error.message || 'Internal server error' });
    }
  }
);

// ── POST /api/auth/refresh ───────────────────────────────
router.post('/refresh',
  body('refreshToken').notEmpty(),
  async (req, res) => {
    const errs = validationResult(req);
    if (!errs.isEmpty()) return res.status(400).json({ error: 'refreshToken required' });

    const { refreshToken } = req.body;

    let payload;
    try {
      payload = jwt.verify(refreshToken, REFRESH_SECRET);
    } catch {
      return res.status(401).json({ error: 'Invalid or expired refresh token' });
    }

    const session = await Session.findOne({ refreshToken, revokedAt: null });
    if (!session || session.expiresAt < new Date()) {
      return res.status(401).json({ error: 'Session expired, please sign in again' });
    }

    const user = await User.findById(payload.sub);
    if (!user || user.isBanned) return res.status(401).json({ error: 'User not found' });

    // Rotate refresh token
    session.revokedAt = new Date();
    await session.save();

    const tokens = await issueTokens(user, req);
    res.json(tokens);
  }
);

// ── POST /api/auth/logout ────────────────────────────────
router.post('/logout', async (req, res) => {
  const { refreshToken } = req.body;
  if (refreshToken) {
    await Session.updateOne({ refreshToken }, { revokedAt: new Date() });
  }
  res.json({ message: 'Logged out' });
});

// ── POST /api/auth/logout-all ────────────────────────────
const { requireAuth } = require('../middleware/auth');
router.post('/logout-all', requireAuth, async (req, res) => {
  await Session.updateMany({ userId: req.user._id, revokedAt: null }, { revokedAt: new Date() });
  res.json({ message: 'All sessions revoked' });
});

module.exports = router;
