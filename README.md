# Backend - User Authentication (Express + SQLite)

This is the backend service for the Klickks Authentication App.  
It provides APIs for user registration, login, session management, and logout.  
Built with Node.js, Express, and SQLite.

---

## Features
- User registration with hashed passwords (bcrypt)
- Login with session-based authentication
- Logout (session destroy)
- Session persistence with connect-sqlite3
- SQLite database with automatic schema creation
- CORS enabled for frontend deployment

---

## Database Schema

SQLite is used (`users.db` file in project root).  
The `users` table is automatically created if not present.

```sql
CREATE TABLE IF NOT EXISTS users (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  email TEXT UNIQUE,
  password_hash TEXT
);
