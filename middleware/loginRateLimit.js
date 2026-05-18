const MAX_ATTEMPTS = parseInt(process.env.LOGIN_MAX_ATTEMPTS || '5', 10);
const LOCK_WINDOW_MS = parseInt(process.env.LOGIN_LOCK_MS || '60000', 10);

const attempts = new Map();

const buildKey = (req) => {
  const rawUsername = (req.body && req.body.username) || '';
  const username = rawUsername.toString().trim().toLowerCase();
  const ip = req.ip || (req.connection && req.connection.remoteAddress) || 'unknown';
  return `${ip}:${username || 'unknown'}`;
};

const getRecord = (key) => attempts.get(key) || { count: 0, lockedUntil: 0 };

const isLocked = (record, now) => record.lockedUntil && record.lockedUntil > now;

const normalizeRecord = (record, now) => {
  if (record.lockedUntil && record.lockedUntil <= now) {
    return { count: 0, lockedUntil: 0 };
  }

  return record;
};

const checkLoginRateLimit = (req, res, next) => {
  const key = buildKey(req);
  const now = Date.now();
  const record = normalizeRecord(getRecord(key), now);

  attempts.set(key, record);

  if (isLocked(record, now)) {
    return res.redirect('/login-page?error=locked');
  }

  return next();
};

const recordLoginFailure = (req) => {
  const key = buildKey(req);
  const now = Date.now();
  const record = normalizeRecord(getRecord(key), now);

  const updatedCount = record.count + 1;
  const updatedRecord = {
    count: updatedCount,
    lockedUntil: updatedCount >= MAX_ATTEMPTS ? now + LOCK_WINDOW_MS : 0
  };

  attempts.set(key, updatedRecord);
};

const resetLoginAttempts = (req) => {
  const key = buildKey(req);
  attempts.delete(key);
};

module.exports = {
  checkLoginRateLimit,
  recordLoginFailure,
  resetLoginAttempts
};
