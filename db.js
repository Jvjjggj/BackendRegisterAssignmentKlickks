// db.js
const sqlite3 = require("sqlite3").verbose();

// Open (or create) a SQLite database file
const db = new sqlite3.Database("users.db", (err) => {
  if (err) {
    console.error("❌ Failed to connect to the database:", err.message);
  } else {
    console.log("✅ Connected to SQLite database (sqlite3)");

    // Create the users table if it doesn’t exist
    db.run(
      `CREATE TABLE IF NOT EXISTS users (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        email TEXT UNIQUE,
        password_hash TEXT
      )`,
      (err) => {
        if (err) {
          console.error("❌ Failed to create users table:", err.message);
        } else {
          console.log("✅ Users table is ready");
        }
      }
    );
  }
});

module.exports = db;
