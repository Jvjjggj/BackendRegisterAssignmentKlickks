// server.js
const express = require("express");
const session = require("express-session");
const cookieParser = require("cookie-parser");
const cors = require("cors");
const path = require("path");

// ensure DB initializes tables
require("./db");

const authRoutes = require("./routes/auth");

const app = express();

// ---- Config ----
const PORT = process.env.PORT || 4000;
// IMPORTANT: set this to your frontend origin when we build it
const FRONTEND_ORIGIN = process.env.FRONTEND_ORIGIN || "http://localhost:3000";
const SESSION_SECRET = process.env.SESSION_SECRET || "dev_secret_change_me";

// ---- Middleware ----
app.use(
  cors({
    origin: FRONTEND_ORIGIN,
    credentials: true, // allow cookies
  })
);

app.use(express.json());
app.use(cookieParser());

app.use(
  session({
    name: "sid", // cookie name
    secret: SESSION_SECRET,
    resave: false,
    saveUninitialized: false,
    cookie: {
      httpOnly: true,
      sameSite: "lax",
      secure: false, // set true behind HTTPS/proxy in production
      maxAge: 1000 * 60 * 60 * 24 * 7, // 7 days
    },
  })
);

// ---- Routes ----
app.get("/", (req, res) => res.json({ status: "ok" }));
app.use("/api/auth", authRoutes);

// ---- Start ----
app.listen(PORT, () => {
  console.log(`Server listening on http://localhost:${PORT}`);
  console.log(`CORS origin: ${FRONTEND_ORIGIN}`);
});
