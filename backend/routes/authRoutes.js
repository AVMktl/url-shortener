const express = require('express');
const bcrypt = require('bcrypt');
const { signAccess, signRefresh, verifyRefresh, verifyAccess, ACCESS_EXPIRES, REFRESH_EXPIRES } = require('../utils/jwt');
const { createUser, getUserByEmail, getUserById } = require('../models/userModels');
const { storeRefreshToken, isRefreshTokenValid, revokeRefreshToken } = require('../services/authService');
const { v4: uuidv4 } = require('uuid');

const router = express.Router();

/**
 * Helper: convert "15m" or "7d" to ms for cookie maxAge
 * supports 'm' (minutes) and 'd' (days)
 */
function tokenDurationToMs(tokenStr) {
  if (!tokenStr) return 0;
  if (tokenStr.endsWith('d')) {
    const n = parseInt(tokenStr.slice(0, -1), 10);
    return n * 24 * 60 * 60 * 1000;
  }
  if (tokenStr.endsWith('m')) {
    const n = parseInt(tokenStr.slice(0, -1), 10);
    return n * 60 * 1000;
  }
  return 0;
}

/**
 * POST /api/auth/register
 * { email, password, name? }
 */
router.post('/register', async (req, res) => {
  try {
    const { email, password, name } = req.body;
    if (!email || !password) return res.status(400).json({ error: 'email & password required' });

    const existing = await getUserByEmail(email);
    if (existing) return res.status(409).json({ error: 'email already registered' });

    const passwordHash = await bcrypt.hash(password, 12);
    const user = await createUser({ email, passwordHash, name });

    // sign tokens
    const accessToken = signAccess({ sub: user.id, email: user.email });
    const refreshId = uuidv4();
    const refreshToken = signRefresh({ sub: user.id, tid: refreshId });

    // store refresh token server-side with expiry
    const expiresAt = new Date(Date.now() + tokenDurationToMs(REFRESH_EXPIRES));
    await storeRefreshToken({ userId: user.id, tokenId: refreshId, expiresAt });

    // set cookies (HttpOnly)
    res.cookie('access_token', accessToken, {
      httpOnly: true,
      sameSite: 'lax',
      secure: process.env.NODE_ENV === 'production',
      maxAge: tokenDurationToMs(ACCESS_EXPIRES)
    });

    res.cookie('refresh_token', refreshToken, {
      httpOnly: true,
      sameSite: 'lax',
      secure: process.env.NODE_ENV === 'production',
      maxAge: tokenDurationToMs(REFRESH_EXPIRES)
    });

    res.json({ ok: true, user: { id: user.id, email: user.email, name: user.name } });
  } catch (err) {
    console.error('register error', err);
    res.status(500).json({ error: 'server error' });
  }
});

/**
 * POST /api/auth/login
 * { email, password }
 */
router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;
    if (!email || !password) return res.status(400).json({ error: 'email & password required' });

    const user = await getUserByEmail(email);
    if (!user) return res.status(401).json({ error: 'invalid credentials' });

    const ok = await bcrypt.compare(password, user.passwordHash);
    if (!ok) return res.status(401).json({ error: 'invalid credentials' });

    const accessToken = signAccess({ sub: user.rowKey, email: user.email });
    const refreshId = uuidv4();
    const refreshToken = signRefresh({ sub: user.rowKey, tid: refreshId });

    const expiresAt = new Date(Date.now() + tokenDurationToMs(REFRESH_EXPIRES));
    await storeRefreshToken({ userId: user.rowKey, tokenId: refreshId, expiresAt });

    res.cookie('access_token', accessToken, {
      httpOnly: true,
      sameSite: 'lax',
      secure: process.env.NODE_ENV === 'production',
      maxAge: tokenDurationToMs(ACCESS_EXPIRES)
    });

    res.cookie('refresh_token', refreshToken, {
      httpOnly: true,
      sameSite: 'lax',
      secure: process.env.NODE_ENV === 'production',
      maxAge: tokenDurationToMs(REFRESH_EXPIRES)
    });

    res.json({ ok: true, user: { id: user.rowKey, email: user.email, name: user.name } });
  } catch (err) {
    console.error('login error', err);
    res.status(500).json({ error: 'server error' });
  }
});

/**
 * POST /api/auth/refresh
 * Reads refresh_token cookie, validates server-side, issues new access cookie.
 */
router.post('/refresh', async (req, res) => {
  try {
    const token = req.cookies && req.cookies.refresh_token;
    if (!token) return res.status(401).json({ error: 'no refresh token' });

    // verify token signature & payload
    let payload;
    try {
      payload = verifyRefresh(token);
    } catch (err) {
      return res.status(401).json({ error: 'invalid refresh token' });
    }

    const userId = payload.sub;
    const tokenId = payload.tid;

    const valid = await isRefreshTokenValid(userId, tokenId);
    if (!valid) return res.status(401).json({ error: 'refresh token not valid' });

    // issue new access (we do not rotate refresh token here; optional to rotate)
    const user = await getUserById(userId);
    if (!user) return res.status(401).json({ error: 'user not found' });

    const accessToken = signAccess({ sub: userId, email: user.email });
    res.cookie('access_token', accessToken, {
      httpOnly: true,
      sameSite: 'lax',
      secure: process.env.NODE_ENV === 'production',
      maxAge: tokenDurationToMs(ACCESS_EXPIRES)
    });

    res.json({ ok: true });
  } catch (err) {
    console.error('refresh error', err);
    res.status(500).json({ error: 'server error' });
  }
});

/**
 * POST /api/auth/logout
 * Revoke refresh token (if present) and clear cookies.
 */
router.post('/logout', async (req, res) => {
  try {
    const token = req.cookies && req.cookies.refresh_token;
    if (token) {
      try {
        const payload = verifyRefresh(token);
        await revokeRefreshToken(payload.sub, payload.tid);
      } catch (err) {
        // ignore invalid token
      }
    }

    res.clearCookie('access_token');
    res.clearCookie('refresh_token');
    res.json({ ok: true });
  } catch (err) {
    console.error('logout err', err);
    res.status(500).json({ error: 'server error' });
  }
});

router.get('/me', async (req, res) => {
  try {
    const token = req.cookies && req.cookies.access_token;
    if (!token) return res.status(401).json({ error: 'Not authenticated' });
    let payload;
    try {
      payload = verifyAccess(token);
    } catch (err) {
      return res.status(401).json({ error: 'Invalid token' });
    }
    const user = await getUserById(payload.sub);
    if (!user) return res.status(401).json({ error: 'User not found' });
    res.json({ user: { id: user.rowKey || payload.sub, email: user.email, name: user.name || '' } });
  } catch (err) {
    console.error('me err', err);
    res.status(500).json({ error: 'server error' });
  }
});

module.exports = router;