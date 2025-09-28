require('dotenv').config();
const express = require('express');
const { AzureNamedKeyCredential, TableClient } = require('@azure/data-tables');
const { nanoid } = require('nanoid');

const app = express();
app.use(express.json());

const credential = new AzureNamedKeyCredential(process.env.AZURE_STORAGE_ACCOUNT, process.env.AZURE_STORAGE_ACCOUNT_KEY);
const client = new TableClient(`https://${process.env.AZURE_STORAGE_ACCOUNT}.table.core.windows.net`, process.env.TABLE_NAME, credential);

// Create table if not exists
(async () => {
    try {
        await client.createTable();
        console.log('Table ready');
    } catch (err) {
        if (err.statusCode !== 409) console.error(err); // ignore if table exists
    }
})();

// Endpoint to shorten a URL
app.post('/shorten', async (req, res) => {
    const { longUrl } = req.body;

    if (!longUrl || !longUrl.startsWith('http')) {
        return res.status(400).json({ error: 'Invalid URL' });
    }

    const shortCode = nanoid(6); // generate a 6-char code

    try {
        await client.createEntity({
            partitionKey: 'url',
            rowKey: shortCode,
            LongUrl: longUrl,
            CreatedAt: new Date().toISOString()
        });
        res.json({ shortUrl: `${process.env.BASE_URL}/${shortCode}` });
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Server error' });
    }
});

// Endpoint to redirect
app.get('/:shortCode', async (req, res) => {
    const { shortCode } = req.params;
    
    try {
        const entity = await client.getEntity('url', shortCode);
        res.redirect(entity.LongUrl);
    } catch (err) {
        res.status(404).json({ error: 'URL not found' });
    }
});

app.get('/', (req, res) => {
    res.send('Welcome to URL Shortener Service');
});

// Start server
const port = process.env.PORT || 3000;
app.listen(port, () => console.log(`Server running on port ${port}`));