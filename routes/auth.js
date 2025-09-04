// routes/auth.js
const express = require("express");
const bcrypt = require("bcrypt");
const db = require("../db");

const router = express.Router();

const normalizeEmail = (email) => String(email || "").trim().toLowerCase();

// POST /api/auth/register
router.post("/register", async (req, res) => {
  const { email, password } = req.body;
  const normEmail = normalizeEmail(email);

  if (!normEmail || !password || password.length < 6) {
    return res
      .status(400)
      .json({ error: "Email and password (min 6 chars) are required." });
  }

  try {
    const hash = await bcrypt.hash(password, 10);

    db.run(
      "INSERT INTO users (email, password_hash) VALUES (?, ?)",
      [normEmail, hash],
      function (err) {
        if (err) {
          if (String(err.message).includes("UNIQUE")) {
            return res.status(409).json({ error: "Email already registered." });
          }
          console.error(err);
          return res.status(500).json({ error: "Database error." });
        }

        // create session
        req.session.userId = this.lastID;
        req.session.email = normEmail;

        return res.status(201).json({ id: this.lastID, email: normEmail });
      }
    );
  } catch (e) {
    console.error(e);
    return res.status(500).json({ error: "Server error." });
  }
});

// POST /api/auth/login
router.post("/login", (req, res) => {
  const { email, password } = req.body;
  const normEmail = normalizeEmail(email);

  if (!normEmail || !password) {
    return res.status(400).json({ error: "Email and password are required." });
  }

  db.get(
    "SELECT id, email, password_hash FROM users WHERE email = ?",
    [normEmail],
    async (err, row) => {
      if (err) {
        console.error(err);
        return res.status(500).json({ error: "Database error." });
      }
      if (!row) {
        return res.status(401).json({ error: "Invalid credentials." });
      }

      const ok = await bcrypt.compare(password, row.password_hash);
      if (!ok) {
        return res.status(401).json({ error: "Invalid credentials." });
      }

      // create session
      req.session.userId = row.id;
      req.session.email = row.email;

      return res.json({ id: row.id, email: row.email });
    }
  );
});

// GET /api/auth/me  (session check)
router.get("/me", (req, res) => {
  if (req.session.userId) {
    return res.json({ id: req.session.userId, email: req.session.email });
  }
  return res.status(401).json({ error: "Not authenticated." });
});

// POST /api/auth/logout
router.post("/logout", (req, res) => {
  req.session.destroy((err) => {
    if (err) {
      console.error(err);
      return res.status(500).json({ error: "Could not log out." });
    }
    // Clear session cookie
    res.clearCookie("sid");
    return res.json({ ok: true });
  });
});

module.exports = router;
