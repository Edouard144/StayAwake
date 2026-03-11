// scheduler/pinger.js
// node-cron scheduler that pings all active sites every 5 minutes
// This keeps free-tier sites alive by preventing them from going idle

const cron = require('node-cron');
const pool = require('../config/db');

// Use node-fetch v2 syntax
const fetch = (...args) => import('node-fetch').then(({default: fetch}) => fetch(...args));

// Ping a single URL
const pingUrl = async (url) => {
  try {
    const response = await fetch(url, {
      method: 'GET',
      headers: {
        'User-Agent': 'StayAwake/1.0 (Keep-alive service)'
      },
      timeout: 10000 // 10 second timeout
    });
    return response.ok;
  } catch (err) {
    console.error(`Ping failed for ${url}:`, err.message);
    return false;
  }
};

// Main ping function - fetches all active sites and pings them
const pingAllSites = async () => {
  console.log(`[${new Date().toISOString()}] Starting scheduled ping...`);
  
  try {
    // Get all active sites
    const result = await pool.query(
      'SELECT id, url, name FROM sites WHERE active = true'
    );

    const sites = result.rows;
    console.log(`Found ${sites.length} active sites to ping`);

    // Ping each site
    for (const site of sites) {
      const success = await pingUrl(site.url);
      
      if (success) {
        // Update last_pinged timestamp
        await pool.query(
          'UPDATE sites SET last_pinged = NOW() WHERE id = $1',
          [site.id]
        );
        console.log(`✓ Pinged: ${site.name} (${site.url})`);
      } else {
        console.error(`✗ Failed: ${site.name} (${site.url})`);
      }
    }

    console.log(`[${new Date().toISOString()}] Scheduled ping complete`);
  } catch (err) {
    console.error('Error in scheduled ping:', err.message);
  }
};

// Schedule the pinger to run every 5 minutes
// Cron expression: every 5 minutes
const startScheduler = () => {
  console.log('Starting StayAwake pinger scheduler...');
  
  // Run immediately on startup, then every 5 minutes
  pingAllSites();
  
  // Schedule to run every 5 minutes
  cron.schedule('*/5 * * * *', () => {
    pingAllSites();
  });

  console.log('Pinger scheduler running (every 5 minutes)');
};

module.exports = { startScheduler, pingAllSites };
