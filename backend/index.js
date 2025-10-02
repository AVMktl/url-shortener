require('dotenv').config();
const express = require('express');
const { AzureNamedKeyCredential, TableClient } = require('@azure/data-tables');
const { nanoid } = require('nanoid');
const { v4: uuidv4 } = require('uuid');
const path = require('path');
const bcrypt = require('bcrypt');
const cors = require('cors');

const app = express();
app.use(cors());
app.use(express.json());

// Serve React build if you have frontend
app.use(express.static(path.join(__dirname, 'frontend/build')));

const credential = new AzureNamedKeyCredential(
    process.env.AZURE_STORAGE_ACCOUNT,
    process.env.AZURE_STORAGE_ACCOUNT_KEY
);

const shortUrlTableClient = new TableClient(
    `https://${process.env.AZURE_STORAGE_ACCOUNT}.table.core.windows.net`,
    process.env.SHORT_URL_TABLE_NAME,
    credential
);

const urlClicksTableClient = new TableClient(
    `https://${process.env.AZURE_STORAGE_ACCOUNT}.table.core.windows.net`,
    process.env.URL_CLICKS_TABLE_NAME,
    credential
);

// Create tables if they don't exist
(async () => {
    try {
        await shortUrlTableClient.createTable();
        await urlClicksTableClient.createTable();
        console.log('Tables ready');
    } catch (err) {
        if (err.statusCode !== 409) console.error(err);
    }
})();

// Endpoint to shorten URL
app.post('/shorten', async (req, res) => {
    try {
        let { longUrl, expirationDate, alias, password } = req.body;

        if (!longUrl) return res.status(400).json({ error: 'URL is required' });
        if (!password) return res.status(400).json({ error: 'Password is required' });

        const hashedPassword = await bcrypt.hash(password, 10);

        // Validate URL
        try {
            new URL(longUrl);
        } catch {
            return res.status(400).json({ error: 'Invalid URL' });
        }

        if (!alias) alias = nanoid(6);

        // Check if alias exists
        try {
            const existing = await shortUrlTableClient.getEntity('shortUrl', alias);
            if (existing) return res.status(409).json({ error: 'Alias already exists' });
        } catch (err) {
            // entity not found is fine
            if (err.statusCode !== 404) throw err;
        }

        // Insert short URL entity
        shortUrlTableClient.createEntity({
            partitionKey: 'shortUrl',
            rowKey: alias,
            LongUrl: longUrl,
            ExpirationDate: expirationDate || null,
            CreatedAt: new Date().toISOString(),
            TotalClicks: 0,
            Password: hashedPassword
        });

        res.json({ 
            shortUrl: `${process.env.BASE_URL}/${alias}`,
            password: `${password ? '******' : null}`
        });

    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Server error' });
    }
});

// Endpoint to redirect short URL
app.get('/:shortCode', async (req, res) => {
    const { shortCode } = req.params;

    try {
        const entity = await shortUrlTableClient.getEntity('shortUrl', shortCode);

        if (entity.ExpirationDate && new Date(entity.ExpirationDate) < new Date()) {
            return res.status(410).json({ error: 'URL expired' });
        }

        // Increment total clicks
        entity.TotalClicks = (entity.TotalClicks || 0) + 1;
        await shortUrlTableClient.updateEntity(entity, 'Merge');

        // Log click in analytics
        const ip = req.headers['x-forwarded-for'] || req.socket.remoteAddress || 'unknown';
        const userAgent = req.headers['user-agent'] || 'unknown';
        const referrer = req.headers['referer'] || null;

        await urlClicksTableClient.createEntity({
            partitionKey: 'clicks',
            rowKey: uuidv4(),
            Alias: shortCode,
            ShortCode: shortCode,
            ClickedAt: new Date().toISOString(),
            UserAgent: userAgent,
            Referrer: referrer,
            IP: ip,
            Country: 'unknown' // later, you can integrate geo-IP lookup
        });

        res.redirect(entity.LongUrl);

    } catch (err) {
        if (err.statusCode === 404) {
            res.status(404).json({ error: 'URL not found' });
        } else {
            console.error(err);
            res.status(500).json({ error: 'Server error' });
        }
    }
});

// Stats endpoint (analytics)
// Stats endpoint with on-the-fly aggregation
app.post('/api/stats/', async (req, res) => {
    const { alias, password } = req.body;

    try {
        const entity = await shortUrlTableClient.getEntity('shortUrl', alias);

        const valid = await bcrypt.compare(password, entity.Password);
        if (!valid) return res.status(403).json({ error: 'Unauthorized' });

        const clicks = [];
        for await (const click of urlClicksTableClient.listEntities({
            queryOptions: { filter: `Alias eq '${alias}'` }
        })) {
            clicks.push(click);
        }

        // On-the-fly aggregation
        const clicksByDay = {};
        const topReferrers = {};
        const topUserAgents = {};
        let lastClick = null;

        clicks.forEach(c => {
            const date = new Date(c.ClickedAt).toISOString().split('T')[0]; // YYYY-MM-DD
            clicksByDay[date] = (clicksByDay[date] || 0) + 1;

            if (c.Referrer) topReferrers[c.Referrer] = (topReferrers[c.Referrer] || 0) + 1;
            if (c.UserAgent) topUserAgents[c.UserAgent] = (topUserAgents[c.UserAgent] || 0) + 1;

            const clickedAt = new Date(c.ClickedAt);
            if (!lastClick || clickedAt > lastClick) lastClick = clickedAt;
        });

        res.json({
            alias,
            longUrl: entity.LongUrl,
            totalClicks: entity.TotalClicks,
            lastClick,
            clicksOverTime: clicks.map(c => ({
                clickedAt: c.ClickedAt,
                userAgent: c.UserAgent,
                ip: c.IP,
                referrer: c.Referrer
            })),
            clicksByDay,
            topReferrers,
            topUserAgents
        });

    } catch (err) {
        if (err.statusCode === 404) {
            res.status(404).json({ error: 'URL not found' });
        } else {
            console.error(err);
            res.status(500).json({ error: 'Server error' });
        }
    }
});

app.use((req, res, next) => {
  res.status(404).send('Page Not Found');
});

// Start server
const port = process.env.PORT || 3000;
app.listen(port, () => console.log(`Server running on port ${port}`));