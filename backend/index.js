// index.js
// Entry point — starts the Express server and the pinger scheduler

const express    = require('express');
const cors       = require('cors');
require('dotenv').config(); // load .env variables

const authRoutes = require('./routes/authRoutes');
const siteRoutes = require('./routes/siteRoutes');
const startPinger = require('./scheduler/pinger');

const app  = express();
const PORT = process.env.PORT || 5000;

// ── Middleware ─────────────────────────────────────────
app.use(cors());             // allow frontend to call this backend
app.use(express.json());     // parse JSON request bodies

// ── Routes ────────────────────────────────────────────
app.use('/api/auth',  authRoutes);   // /api/auth/register, /api/auth/login
app.use('/api/sites', siteRoutes);   // /api/sites (GET, POST, PATCH, DELETE)

// ── Health check ───────────────────────────────────────
// Useful for testing that the server is alive
app.get('/', (req, res) => {
  res.json({ message: '🟢 StayAwake backend is running' });
});

// ── Start server ───────────────────────────────────────
app.listen(PORT, () => {
  console.log(`🚀 Server running on http://localhost:${PORT}`);

  // Start the pinger — runs every minute in the background
  startPinger();
});
