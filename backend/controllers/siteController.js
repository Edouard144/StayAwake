// controllers/siteController.js
// Handles adding, deleting, listing sites

const pool = require('../config/db');

// Get all sites for the authenticated user
const getSites = async (req, res) => {
  try {
    const userId = req.user.id;

    const result = await pool.query(
      'SELECT id, url, name, active, last_pinged, created_at FROM sites WHERE user_id = $1 ORDER BY created_at DESC',
      [userId]
    );

    res.json({ sites: result.rows });
  } catch (err) {
    console.error('Get sites error:', err.message);
    res.status(500).json({ error: 'Server error fetching sites' });
  }
};

// Add a new site
const addSite = async (req, res) => {
  try {
    const userId = req.user.id;
    const { url, name } = req.body;

    if (!url) {
      return res.status(400).json({ error: 'URL is required' });
    }

    // Validate URL format
    try {
      new URL(url);
    } catch {
      return res.status(400).json({ error: 'Invalid URL format' });
    }

    // Use provided name or extract from URL
    const siteName = name || new URL(url).hostname;

    const result = await pool.query(
      'INSERT INTO sites (user_id, url, name, active) VALUES ($1, $2, $3, $4) RETURNING id, url, name, active, created_at',
      [userId, url, siteName, true]
    );

    res.status(201).json({
      message: 'Site added successfully',
      site: result.rows[0]
    });
  } catch (err) {
    console.error('Add site error:', err.message);
    res.status(500).json({ error: 'Server error adding site' });
  }
};

// Delete a site
const deleteSite = async (req, res) => {
  try {
    const userId = req.user.id;
    const { id } = req.params;

    const result = await pool.query(
      'DELETE FROM sites WHERE id = $1 AND user_id = $2 RETURNING id',
      [id, userId]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Site not found' });
    }

    res.json({ message: 'Site deleted successfully' });
  } catch (err) {
    console.error('Delete site error:', err.message);
    res.status(500).json({ error: 'Server error deleting site' });
  }
};

// Toggle site active status
const toggleSite = async (req, res) => {
  try {
    const userId = req.user.id;
    const { id } = req.params;

    // First get current status
    const current = await pool.query(
      'SELECT active FROM sites WHERE id = $1 AND user_id = $2',
      [id, userId]
    );

    if (current.rows.length === 0) {
      return res.status(404).json({ error: 'Site not found' });
    }

    const newStatus = !current.rows[0].active;

    const result = await pool.query(
      'UPDATE sites SET active = $1 WHERE id = $2 AND user_id = $3 RETURNING id, url, name, active',
      [newStatus, id, userId]
    );

    res.json({
      message: `Site ${newStatus ? 'enabled' : 'disabled'}`,
      site: result.rows[0]
    });
  } catch (err) {
    console.error('Toggle site error:', err.message);
    res.status(500).json({ error: 'Server error toggling site' });
  }
};

module.exports = { getSites, addSite, deleteSite, toggleSite };
