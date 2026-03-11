// config/db.js
// Connects to NeonDB using the pg (node-postgres) library
// We use a "Pool" — it manages multiple connections efficiently

const { Pool } = require('pg');
require('dotenv').config();

// Create a connection pool using the DATABASE_URL from .env
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,

  // NeonDB requires SSL — this tells pg to use it
  ssl: {
    rejectUnauthorized: false
  }
});

// Test the connection when server starts
pool.connect((err) => {
  if (err) {
    console.error('❌ NeonDB connection failed:', err.message);
  } else {
    console.log('✅ Connected to NeonDB');
  }
});

module.exports = pool;