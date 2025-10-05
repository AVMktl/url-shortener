require('dotenv').config();
const express = require('express');
const cookieParser = require('cookie-parser');
const cors = require('cors');
const { createIfNotExists } = require('./config/azureTables');

const app = express();
app.use(cors({ origin: true, credentials: true }));
app.use(express.json());
app.use(cookieParser());

// ensure tables exist on startup
(async function ensureTables() {
  try {
    await createIfNotExists(process.env.USERS_TABLE_NAME || 'Users');
    await createIfNotExists(process.env.REFRESH_TOKENS_TABLE_NAME || 'RefreshTokens');
    console.log('Auth tables ready');
  } catch (err) {
    console.error('Error creating tables', err);
  }
})();

app.use(express.static(path.join(__dirname, 'build')));

app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, 'build', 'index.html'));
});

// routes
const authRoutes = require('./routes/authRoutes');
const urlRoutes = require('./routes/urlRoutes');
const statsRoutes = require('./routes/statsRoutes');

app.use('/api/auth', authRoutes);
app.use(urlRoutes);
app.use(statsRoutes);

// simple health check
app.get('/health', (req, res) => res.json({ ok: true }));

app.use((req, res, next) => {
  res.status(404).json({ error: 'Not found' });
});

// error handler
app.use((err, req, res, next) => {
  console.error('Unhandled error:', err);
  res.status(500).json({ error: 'server error' });
});

const port = process.env.PORT || 3000;
app.listen(port, () => console.log(`Server listening on ${port}`));
