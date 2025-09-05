// routes/auth.js
const express = require("express");
const bcrypt = require("bcrypt");

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

    // Insert user into DB
    req.db.run(
      "INSERT INTO users (email, password_hash) VALUES (?, ?)",
      [normEmail, hash],
      function (err) {
        if (err) {
          if (err.code === "SQLITE_CONSTRAINT") {
            return res.status(409).json({ error: "Email already registered." });
          }
          console.error("Register error:", err);
          return res.status(500).json({ error: "Database error." });
        }

        // Fetch inserted user
        req.db.get(
          "SELECT id, email FROM users WHERE id = ?",
          [this.lastID],
          (err, user) => {
            if (err) {
              console.error("Fetch user error:", err);
              return res.status(500).json({ error: "Database error." });
            }

            // Save session
            req.session.userId = user.id;
            req.session.email = user.email;

            return res.status(201).json(user);
          }
        );
      }
    );
  } catch (err) {
    console.error("Register error:", err);
    return res.status(500).json({ error: "Internal server error." });
  }
});

// ---------------- LOGIN ----------------
router.post("/login", (req, res) => {
  const { email, password } = req.body;
  const normEmail = normalizeEmail(email);

  if (!normEmail || !password) {
    return res.status(400).json({ message: "Email and password are required" });
  }

  // Look up user
  req.db.get("SELECT * FROM users WHERE email = ?", [normEmail], (err, user) => {
    if (err) {
      console.error("Login DB error:", err);
      return res.status(500).json({ message: "Database error" });
    }
    if (!user) {
      return res.status(400).json({ message: "User not found" });
    }

    // Compare password
    bcrypt.compare(password, user.password_hash, (err, isMatch) => {
      if (err) {
        console.error("Compare error:", err);
        return res.status(500).json({ message: "Server error" });
      }
      if (!isMatch) {
        return res.status(400).json({ message: "Invalid credentials" });
      }

      // Save session
      req.session.userId = user.id;
      req.session.email = user.email;

      res.json({ message: "Login successful", id: user.id, email: user.email });
    });
  });
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
      console.error("Logout error:", err);
      return res.status(500).json({ error: "Could not log out." });
    }
    res.clearCookie("sid"); // clear session cookie
    return res.json({ ok: true });
  });
});

module.exports = router;
