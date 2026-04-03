/**
 * models/userModel.js — Users Table
 * Schema and query helpers for user accounts.
 */

const { query } = require('../config/db');

/**
 * Create the `users` table if it doesn't already exist.
 * Called once on server startup via initDB().
 */
const createUsersTable = async () => {
  await query(`
    CREATE TABLE IF NOT EXISTS users (
      id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      email       STRING(255) NOT NULL UNIQUE,
      password_hash STRING(255) NOT NULL,
      created_at  TIMESTAMPTZ NOT NULL DEFAULT now()
    )
  `);
};

/**
 * Insert a new user record.
 * @param {string} email
 * @param {string} passwordHash - bcrypt hash of the user's password
 * @returns {Object} The newly created user row
 */
const createUser = async (email, passwordHash) => {
  const result = await query(
    `INSERT INTO users (email, password_hash) VALUES ($1, $2) RETURNING id, email, created_at`,
    [email, passwordHash]
  );
  return result.rows[0];
};

/**
 * Fetch a user by email (used during login).
 * @param {string} email
 * @returns {Object|null} User row including password_hash, or null if not found
 */
const getUserByEmail = async (email) => {
  const result = await query(
    `SELECT id, email, password_hash, created_at FROM users WHERE email = $1`,
    [email]
  );
  return result.rows[0] || null;
};

/**
 * Fetch a user by their UUID (used to validate JWT subject).
 * @param {string} id
 * @returns {Object|null}
 */
const getUserById = async (id) => {
  const result = await query(
    `SELECT id, email, created_at FROM users WHERE id = $1`,
    [id]
  );
  return result.rows[0] || null;
};

module.exports = { createUsersTable, createUser, getUserByEmail, getUserById };
