// routes/statsRoutes.js
const express = require('express');
const { requireAuth } = require('../middleware/authMiddleware');
const { getShortUrl } = require('../models/urlModels'); // reuse url model
const { getClicksByAlias, aggregateClicks } = require('../models/statsModels');

const router = express.Router();

/**
 * GET /api/stats/:alias
 * Only authenticated users can see stats for their own URLs
 */
router.get('/api/stats/:alias', requireAuth, async (req, res) => {
  try {
    const { alias } = req.params;
    const urlEntity = await getShortUrl(alias);

    if (!urlEntity) return res.status(404).json({ error: 'URL not found' });

    // Ensure the URL belongs to the logged-in user
    if (urlEntity.userId !== req.user.id) {
      return res.status(403).json({ error: 'Not authorized to view stats' });
    }

    const clicks = await getClicksByAlias(alias);
    const { clicksByDay, topReferrers, topUserAgents, lastClick } = aggregateClicks(clicks);

    res.json({
      alias: urlEntity.rowKey,
      longUrl: urlEntity.longUrl,
      totalClicks: clicks.length,
      createdAt: urlEntity.createdAt,
      expirationDate: urlEntity.expirationDate,
      lastClick,
      clicksByDay,
      topReferrers,
      topUserAgents,
      clicksOverTime: clicks.map(c => ({
        clickedAt: c.clickedAt,
        ip: c.ip,
        referrer: c.referrer,
        userAgent: c.userAgent
      }))
    });
  } catch (err) {
    console.error('stats error', err);
    res.status(500).json({ error: 'server error' });
  }
});

module.exports = router;
