const jwt = require('jsonwebtoken');
const User = require('../models/User');
const Session = require('../models/Session');

const ACCESS_SECRET  = process.env.JWT_ACCESS_SECRET  || 'sektion_access_secret_change_in_prod';
const REFRESH_SECRET = process.env.JWT_REFRESH_SECRET || 'sektion_refresh_secret_change_in_prod';
const ACCESS_TTL     = '15m';
const REFRESH_TTL    = '7d';

/** Generate a short-lived access token */
const signAccess = (userId) =>
  jwt.sign({ sub: userId, type: 'access' }, ACCESS_SECRET, { expiresIn: ACCESS_TTL });

/** Generate a long-lived refresh token */
const signRefresh = (userId) =>
  jwt.sign({ sub: userId, type: 'refresh' }, REFRESH_SECRET, { expiresIn: REFRESH_TTL });

/** Middleware: verify Bearer access token, attach req.user */
const requireAuth = async (req, res, next) => {
  const header = req.headers.authorization;
  if (!header || !header.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'No token provided' });
  }

  try {
    const token = header.split(' ')[1];
    const payload = jwt.verify(token, ACCESS_SECRET);
    if (payload.type !== 'access') throw new Error('Wrong token type');

    const user = await User.findById(payload.sub).select('-__v');
    if (!user) return res.status(401).json({ error: 'User not found' });

    req.user = user;
    next();
  } catch (err) {
    if (err.name === 'TokenExpiredError') {
      return res.status(401).json({ error: 'Token expired', code: 'TOKEN_EXPIRED' });
    }
    return res.status(401).json({ error: 'Invalid token' });
  }
};

/** Optional auth — attaches req.user if token present, but doesn't block */
const optionalAuth = async (req, _res, next) => {
  const header = req.headers.authorization;
  if (!header?.startsWith('Bearer ')) return next();
  try {
    const token = header.split(' ')[1];
    const payload = jwt.verify(token, ACCESS_SECRET);
    req.user = await User.findById(payload.sub).select('-__v');
  } catch {
    /* ignore */
  }
  next();
};

/** Admin only */
const requireAdmin = (req, res, next) => {
  if (!req.user?.isAdmin) return res.status(403).json({ error: 'Admin access required' });
  next();
};

module.exports = { signAccess, signRefresh, requireAuth, optionalAuth, requireAdmin, ACCESS_SECRET, REFRESH_SECRET };
