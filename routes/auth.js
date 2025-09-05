// routes/auth.js
const express = require("express");
const bcrypt = require("bcrypt");
const db = require("../db");

const router = express.Router();

// Normalize email before storing/querying
const normalizeEmail = (email) => String(email || "").trim().toLowerCase();

// ---------------- REGISTER ----------------
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

    db.prepare(
      "INSERT INTO users (email, password_hash) VALUES (?, ?)"
    ).run(normEmail, hash);

    // create session
    const user = db.prepare("SELECT * FROM users WHERE email = ?").get(normEmail);
    req.session.userId = user.id;
    req.session.email = user.email;

    return res.status(201).json({ id: user.id, email: user.email });
  } catch (err) {
    if (String(err.message).includes("UNIQUE")) {
      return res.status(409).json({ error: "Email already registered." });
    }
    console.error("Register error:", err);
    return res.status(500).json({ error: "Database error." });
  }
});

// ---------------- LOGIN ----------------
router.post("/login", (req, res) => {
  const { email, password } = req.body;
  const normEmail = normalizeEmail(email);

  console.log("Login request:", normEmail);

  const user = db.prepare("SELECT * FROM users WHERE email = ?").get(normEmail);
  console.log("User from DB:", user);

  if (!user) {
    return res.status(400).json({ message: "User not found" });
  }

  try {
    const isMatch = bcrypt.compareSync(password, user.password_hash);
    if (!isMatch) {
      return res.status(400).json({ message: "Invalid credentials" });
    }

    // save session
    req.session.userId = user.id;
    req.session.email = user.email;

    res.json({ message: "Login successful", id: user.id, email: user.email });
  } catch (err) {
    console.error("Compare error:", err);
    res.status(500).json({ message: "Server error" });
  }
});

// ---------------- SESSION CHECK ----------------
router.get("/me", (req, res) => {
  if (req.session.userId) {
    return res.json({ id: req.session.userId, email: req.session.email });
  }
  return res.status(401).json({ error: "Not authenticated." });
});

// ---------------- LOGOUT ----------------
router.post("/logout", (req, res) => {
  req.session.destroy((err) => {
    if (err) {
      console.error(err);
      return res.status(500).json({ error: "Could not log out." });
    }
    res.clearCookie("sid"); // clear session cookie
    return res.json({ ok: true });
  });
});

module.exports = router;
