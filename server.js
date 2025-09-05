// server.js
const express = require("express");
const session = require("express-session");
const SQLiteStore = require("connect-sqlite3")(session);
const sqlite3 = require("sqlite3").verbose();
const cors = require("cors");
const cookieParser = require("cookie-parser");

// -----------------
// Database setup
// -----------------
const db = new sqlite3.Database("users.db", (err) => {
  if (err) {
    console.error("❌ Failed to connect to database:", err.message);
  } else {
    console.log("✅ Connected to SQLite database");

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

const app = express();
const PORT = process.env.PORT || 5000;

// -----------------
// Middleware
// -----------------

// Allow cross-origin requests from frontend
app.use(
  cors({
    origin: [
      "http://localhost:3000", // for local dev
      "https://your-frontend.onrender.com", // 🔹 replace with your deployed frontend URL
    ],
    credentials: true,
  })
);

app.use(cookieParser());
app.use(express.json());

// Session middleware with environment-based settings
app.use(
  session({
    store: new SQLiteStore({ db: "sessions.db", dir: "." }),
    secret: process.env.SESSION_SECRET || "supersecret",
    resave: false,
    saveUninitialized: false,
    cookie: {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production", // ✅ only true on Render (HTTPS)
      sameSite: process.env.NODE_ENV === "production" ? "none" : "lax", // ✅ allow cross-origin in prod
      maxAge: 1000 * 60 * 60, // 1 hour
    },
  })
);

// Attach db to req for routes
app.use((req, res, next) => {
  req.db = db;
  next();
});

// -----------------
// Routes
// -----------------
const authRoutes = require("./routes/auth");
app.use("/api/auth", authRoutes);

app.get("/", (req, res) => {
  res.send("✅ Backend is running successfully!");
});

// -----------------
// Start server
// -----------------
app.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`);
});
