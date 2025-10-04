// middleware/authMiddleware.js
const { verifyAccess } = require('../utils/jwt');

/**
 * Reads access JWT from a cookie named 'access_token' (HttpOnly)
 * If valid -> req.user = { id: sub, email }
 * If missing/invalid -> req.user = null
 */
function authOptional(req, res, next) {
  const token = req.cookies && req.cookies.access_token;
  if (!token) { req.user = null; return next(); }
  try {
    const payload = verifyAccess(token);
    req.user = { id: payload.sub, email: payload.email };
  } catch (err) {
    req.user = null;
  }
  return next();
}

function requireAuth(req, res, next) {
  const token = req.cookies && req.cookies.access_token;
  if (!token) return res.status(401).json({ error: 'Access token missing' });

  try {
    const payload = verifyAccess(token);
    req.user = { id: payload.sub, email: payload.email };
    next();
  } catch (err) {
    return res.status(401).json({ error: 'Invalid or expired token' });
  }
}


module.exports = { authOptional, requireAuth };

