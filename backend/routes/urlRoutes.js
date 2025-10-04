// routes/urlRoutes.js
const express = require('express');
const { authOptional, requireAuth } = require('../middleware/authMiddleware');
const { createShortUrl, getShortUrl, incrementClicks, logClick, listUrlsByUser } = require('../models/urlModels');

const router = express.Router();

function isValidUrl(url) {
  try {
    const parsed = new URL(url);
    return parsed.protocol === "http:" || parsed.protocol === "https:";
  } catch {
    return false;
  }
}

/**
 * POST /api/shorten
 * { longUrl, alias?, expirationDate? }
 * - Anonymous: alias ignored (random)
 * - Authenticated: alias optional
 */
router.post('/shorten', authOptional, async (req, res) => {
  try {
    const { longUrl, alias, expirationDate } = req.body;
    const userId = req.user ? req.user.id : null;

    if (!longUrl) return res.status(400).json({ error: 'longUrl required' });
    
    if (!isValidUrl(longUrl)) return res.status(400).json({ error: 'Invalid URL format' });
    
    const entity = await createShortUrl({ longUrl, userId, alias: userId ? alias : null, expirationDate });

    res.json({
      shortUrl: `${process.env.BASE_URL}/${entity.rowKey}`,
      alias: entity.rowKey,
      expiresAt: entity.expirationDate
    });
  } catch (err) {
    console.error('shorten err', err);
    res.status(500).json({ error: 'server error' });
  }
});

/**
 * GET /:alias
 * Redirect to longUrl and log click
 */
router.get('/:alias', async (req, res) => {
  try {
    const { alias } = req.params;
    const entity = await getShortUrl(alias);
    if (!entity) return res.status(404).json({ error: 'URL not found' });

    // check expiry
    if (entity.expirationDate && new Date(entity.expirationDate) < new Date()) {
      return res.status(410).json({ error: 'URL expired' });
    }

    // increment clicks
    await incrementClicks(entity);

    // log click
    const ip = req.headers['x-forwarded-for'] || req.socket.remoteAddress || 'unknown';
    const userAgent = req.headers['user-agent'] || 'unknown';
    const referrer = req.headers['referer'] || null;

    await logClick({ alias: entity.rowKey, userAgent, referrer, ip });

    res.redirect(entity.longUrl);
  } catch (err) {
    console.error('redirect err', err);
    res.status(500).json({ error: 'server error' });
  }
});

/**
 * GET /api/history
 * Return all URLs for logged-in user
 */
router.get('/api/history', requireAuth, async (req, res) => {
  try {
    const userId = req.user.id;
    const urls = await listUrlsByUser(userId);
    res.json({ urls });
  } catch (err) {
    console.error('history err', err);
    res.status(500).json({ error: 'server error' });
  }
});

module.exports = router;