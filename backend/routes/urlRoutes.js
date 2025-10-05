// routes/urlRoutes.js
const express = require('express');
const { authOptional, requireAuth } = require('../middleware/authMiddleware');
const { createShortUrl, getShortUrl, incrementClicks, logClick, listUrlsByUser } = require('../models/urlModels');
const { lookup } = require('fast-geoip');
const QRCode = require('qrcode');

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
 * GET /api/history
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

/**
 * GET /qrcode/:alias
 * Generate QR code for a given URL
 */
router.get('/qrcode/:alias', authOptional, async (req, res) => {
   try {
    const { alias } = req.params;
    const entity = await getShortUrl(alias);

    if (!entity) return res.status(404).json({ error: 'URL not found' });
    if (entity.userId !== req.user.id) return res.status(403).json({ error: 'Unauthorized' });

    const shortUrl = `${process.env.BASE_URL}/${alias}`;
    const qrDataUrl = await QRCode.toDataURL(shortUrl, {
      width: 200,
      margin: 2,
      color: { dark: '#22c55e', light: '#000000' }
    });

    res.json({ qr: qrDataUrl });
  } catch (err) {
    console.error('QR generation error:', err);
    res.status(500).json({ error: 'Failed to generate QR code' });
  }
});

/**
 * GET /:alias
 * Redirect to longUrl and log click with geo info
 */
router.get('/:alias', async (req, res, next) => {
  try {
    const { alias } = req.params;
    const entity = await getShortUrl(alias);
    if (!entity) return next(); // 404

    // check expiry
    if (entity.expirationDate && new Date(entity.expirationDate) < new Date()) {
      return res.status(410).json({ error: 'URL expired' });
    }

    // increment clicks
    await incrementClicks(entity);

    let ip = req.headers['x-forwarded-for'] || req.socket.remoteAddress || 'unknown';

    // If x-forwarded-for has multiple IPs, take the first
    ip = ip.split(',')[0].trim();

    // Remove IPv6 prefix (::ffff:)
    ip = ip.replace('::ffff:', '');

    // Remove port if present (e.g., 223.189.94.131:64188 → 223.189.94.131)
    ip = ip.split(':')[0];

    // Optional: Handle localhost / testing cases
    if (ip === '::1' || ip === '127.0.0.1') ip = 'unknown'

    const userAgent = req.headers['user-agent'] || 'unknown';
    const referrer = req.headers['referer'] || null;

    // Await the geo lookup!
    const geo = (await lookup(ip)) || {};
    const country = geo.country || 'unknown';
    const region = geo.region || 'unknown';
    const city = geo.city || 'unknown';

    await logClick({ alias: entity.rowKey, userAgent, referrer, ip, country, region, city });

    res.redirect(entity.longUrl);
  } catch (err) {
    console.error('redirect err', err);
    res.status(500).json({ error: 'server error' });
  }
});


module.exports = router;