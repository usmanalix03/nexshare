/**
 * config/db.js — CockroachDB Connection
 * Uses the `pg` library with a connection pool.
 * CockroachDB is PostgreSQL-compatible, so no special driver is needed.
 */

const { Pool } = require('pg');

// Create a connection pool using the DATABASE_URL from .env
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: process.env.DATABASE_URL?.includes('sslmode=disable')
    ? false
    // CockroachDB Cloud requires SSL; rejectUnauthorized: false allows self-signed certs
    : { rejectUnauthorized: false },
  max: 10,              // max connections in pool
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 5000,
});

pool.on('error', (err) => {
  console.error('Unexpected pg pool error:', err);
});

/**
 * Run a parameterized query against CockroachDB.
 * @param {string} text  - SQL query string
 * @param {Array}  params - Query parameters
 */
const query = (text, params) => pool.query(text, params);

module.exports = { query, pool };
