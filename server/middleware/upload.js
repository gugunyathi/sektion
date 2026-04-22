const multer = require('multer');
const path = require('path');
const fs = require('fs');

const UPLOAD_DIR = path.join(__dirname, '../uploads');

// Ensure directories exist (skip on read-only filesystems like Vercel serverless)
if (process.env.NODE_ENV !== 'production') {
  try {
    ['avatars', 'media', 'items'].forEach((dir) => {
      fs.mkdirSync(path.join(UPLOAD_DIR, dir), { recursive: true });
    });
  } catch (e) {
    console.warn('Could not create upload dirs:', e.message);
  }
}

const ALLOWED_MIME = ['image/jpeg', 'image/png', 'image/webp', 'image/gif', 'video/mp4', 'video/quicktime'];
const MAX_SIZE_IMAGE = 8 * 1024 * 1024;  // 8MB
const MAX_SIZE_VIDEO = 50 * 1024 * 1024; // 50MB

const storage = (subfolder) =>
  multer.diskStorage({
    destination: (_req, _file, cb) => cb(null, path.join(UPLOAD_DIR, subfolder)),
    filename: (_req, file, cb) => {
      const ext = path.extname(file.originalname).toLowerCase();
      const safe = `${Date.now()}-${Math.random().toString(36).slice(2, 8)}${ext}`;
      cb(null, safe);
    },
  });

const fileFilter = (_req, file, cb) => {
  if (!ALLOWED_MIME.includes(file.mimetype)) {
    return cb(Object.assign(new Error('Unsupported file type'), { status: 400 }));
  }
  cb(null, true);
};

exports.uploadAvatar = multer({ storage: storage('avatars'), fileFilter, limits: { fileSize: MAX_SIZE_IMAGE } });
exports.uploadMedia  = multer({ storage: storage('media'),   fileFilter, limits: { fileSize: MAX_SIZE_VIDEO } });
exports.uploadItem   = multer({ storage: storage('items'),   fileFilter, limits: { fileSize: MAX_SIZE_IMAGE } });

/** Build a publicly accessible URL from a relative server path */
exports.toPublicUrl = (req, relativePath) => {
  if (!relativePath) return null;
  const base = process.env.API_BASE_URL || `${req.protocol}://${req.get('host')}`;
  return `${base}/uploads/${relativePath}`;
};
