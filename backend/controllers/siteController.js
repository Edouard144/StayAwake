// controllers/siteController.js
// Handles all CRUD operations for a user's sites
// Uses columns: id, user_id, url, interval_min, is_active, last_pinged, last_status, created_at

const pool = require('../config/db');

// ── GET all sites for logged-in user ──────────────────
const getSites = async (req, res) => {
  try {
    const result = await pool.query(
      `SELECT id, url, interval_min, is_active, last_pinged, last_status, created_at
       FROM sites WHERE user_id = $1 ORDER BY created_at DESC`,
      [req.user.id]
    );
    // Return as { sites: [...] } so frontend can access data.sites
    res.json({ sites: result.rows });
  } catch (err) {
    console.error('Get sites error:', err.message);
    res.status(500).json({ error: 'Could not fetch sites.' });
  }
};

// ── ADD a new site ─────────────────────────────────────
const addSite = async (req, res) => {
  const { url, interval_min } = req.body;

  if (!url || !interval_min) {
    return res.status(400).json({ error: 'URL and interval are required.' });
  }

  // Make sure interval is a valid number, minimum 1 minute
  const interval = parseInt(interval_min);
  if (isNaN(interval) || interval < 1) {
    return res.status(400).json({ error: 'Interval must be a number (minimum 1 minute).' });
  }

  // Validate URL format — must include https://
  try { new URL(url); } catch {
    return res.status(400).json({ error: 'Invalid URL format. Include https://' });
  }

  try {
    const result = await pool.query(
      `INSERT INTO sites (user_id, url, interval_min)
       VALUES ($1, $2, $3)
       RETURNING id, url, interval_min, is_active, last_pinged, last_status, created_at`,
      [req.user.id, url, interval]
    );
    res.status(201).json({
      message: 'Site added successfully',
      site: result.rows[0]
    });
  } catch (err) {
    console.error('Add site error:', err.message);
    res.status(500).json({ error: 'Could not add site.' });
  }
};

// ── TOGGLE pause / resume a site ──────────────────────
const toggleSite = async (req, res) => {
  const { id } = req.params;

  try {
    // Verify this site belongs to the logged-in user
    const site = await pool.query(
      'SELECT id, is_active FROM sites WHERE id = $1 AND user_id = $2',
      [id, req.user.id]
    );

    if (site.rows.length === 0) {
      return res.status(404).json({ error: 'Site not found.' });
    }

    // Flip is_active: true → false, false → true
    const updated = await pool.query(
      `UPDATE sites SET is_active = NOT is_active
       WHERE id = $1
       RETURNING id, url, interval_min, is_active, last_pinged, last_status`,
      [id]
    );

    res.json({
      message: `Site ${updated.rows[0].is_active ? 'resumed' : 'paused'}`,
      site: updated.rows[0]
    });
  } catch (err) {
    console.error('Toggle site error:', err.message);
    res.status(500).json({ error: 'Could not toggle site.' });
  }
};

// ── DELETE a site ──────────────────────────────────────
const deleteSite = async (req, res) => {
  const { id } = req.params;

  try {
    // Only delete if it belongs to this user
    const result = await pool.query(
      'DELETE FROM sites WHERE id = $1 AND user_id = $2 RETURNING id',
      [id, req.user.id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Site not found.' });
    }

    res.json({ message: 'Site deleted successfully.' });
  } catch (err) {
    console.error('Delete site error:', err.message);
    res.status(500).json({ error: 'Could not delete site.' });
  }
};

module.exports = { getSites, addSite, toggleSite, deleteSite };