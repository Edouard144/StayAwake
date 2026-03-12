// scheduler/pinger.js — FIXED VERSION
// This is the ENGINE of StayAwake.
// It runs every 1 minute, checks the DB for sites that are due to be pinged,
// and pings them. Works even when no user is on the website.

const cron  = require('node-cron');
const fetch = require('node-fetch');
const pool  = require('../config/db');

// ── The ping function ──────────────────────────────────
// Sends an HTTP GET to a URL and returns the status code
const pingURL = async (url) => {
  try {
    const response = await fetch(url, {
      method: 'GET',
      // Timeout after 10 seconds — don't hang forever on dead sites
      timeout: 10000
    });
    return response.status; // e.g. 200, 404, 503
  } catch (err) {
    // Network error, DNS fail, server completely down
    console.error(`  ✗ Failed to ping ${url}:`, err.message);
    return null; // null = unreachable
  }
};

// ── Main scheduler ────────────────────────────────────
// Runs every 1 minute — '* * * * *' is cron syntax for "every minute"
const startPinger = () => {
  console.log('🕐 Pinger scheduler started — checking every minute');

  cron.schedule('* * * * *', async () => {
    try {
      // Fetch all ACTIVE sites from the database
      const { rows: sites } = await pool.query(
        'SELECT * FROM sites WHERE is_active = true'
      );

      if (sites.length === 0) return; // nothing to ping

      const now = new Date();

      for (const site of sites) {
        // Calculate when this site was last pinged
        const lastPinged  = site.last_pinged ? new Date(site.last_pinged) : null;
        const intervalMs  = site.interval_min * 60 * 1000; // convert minutes → ms

        // Check if enough time has passed since last ping
        const isDue = !lastPinged || (now - lastPinged) >= intervalMs;

        if (isDue) {
          console.log(`🔔 Pinging [${site.id}] ${site.url}`);

          const status = await pingURL(site.url);

          // Update last_pinged and last_status in the DB
          await pool.query(
            `UPDATE sites
             SET last_pinged = NOW(), last_status = $1
             WHERE id = $2`,
            [status, site.id]
          );

          console.log(`  ${status === 200 ? '✅' : '⚠️'} Status: ${status ?? 'unreachable'}`);
        }
      }

    } catch (err) {
      console.error('Pinger error:', err.message);
    }
  });
};

module.exports = startPinger;