// routes/siteRoutes.js
// Handles site management routes: get, add, delete, toggle

const express = require('express');
const router = express.Router();
const { getSites, addSite, deleteSite, toggleSite } = require('../controllers/siteController');
const auth = require('../middleware/auth');

// All routes require authentication
router.use(auth);

// GET /api/sites - Get all sites for the user
router.get('/', getSites);

// POST /api/sites - Add a new site
router.post('/', addSite);

// DELETE /api/sites/:id - Delete a site
router.delete('/:id', deleteSite);

// PUT /api/sites/:id/toggle - Toggle site active status
router.put('/:id/toggle', toggleSite);

module.exports = router;
