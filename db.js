// db.js
const Database = require("better-sqlite3");

// Open (or create) a SQLite database file
const db = new Database("users.db");

// Create the users table if it doesn’t exist
db.prepare(`
  CREATE TABLE IF NOT EXISTS users (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    email TEXT UNIQUE,
    password_hash TEXT
  )
`).run();

console.log("✅ Connected to SQLite database (better-sqlite3)");

module.exports = db;
