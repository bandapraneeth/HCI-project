/* ============================================================
   MEDI SYNC – Express + SQLite Backend  (server.js)
   ============================================================
   Run:  node server.js
   Open: http://localhost:3000
   ============================================================ */

const express      = require('express');
const Database     = require('better-sqlite3');
const bcrypt       = require('bcryptjs');
const jwt          = require('jsonwebtoken');
const cookieParser = require('cookie-parser');
const path         = require('path');

const app    = express();
const PORT   = 3000;
const SECRET = 'medisync_jwt_secret_key_2024'; // change in production

/* ── DATABASE SETUP ── */
const db = new Database('./db/medisync.db');

db.exec(`
  CREATE TABLE IF NOT EXISTS users (
    id        INTEGER PRIMARY KEY AUTOINCREMENT,
    name      TEXT    NOT NULL,
    phone     TEXT    NOT NULL,
    email     TEXT    NOT NULL UNIQUE,
    password  TEXT    NOT NULL,
    created_at TEXT   DEFAULT (datetime('now'))
  );

  CREATE TABLE IF NOT EXISTS appointments (
    id          INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id     INTEGER,
    patient_name TEXT NOT NULL,
    phone       TEXT NOT NULL,
    age         INTEGER,
    department  TEXT NOT NULL,
    doctor      TEXT NOT NULL,
    appt_date   TEXT NOT NULL,
    appt_time   TEXT NOT NULL,
    reason      TEXT,
    created_at  TEXT DEFAULT (datetime('now')),
    FOREIGN KEY(user_id) REFERENCES users(id)
  );

  CREATE TABLE IF NOT EXISTS room_bookings (
    id           INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id      INTEGER,
    patient_name TEXT NOT NULL,
    phone        TEXT NOT NULL,
    room_type    TEXT NOT NULL,
    price_per_day INTEGER,
    check_in     TEXT NOT NULL,
    num_days     INTEGER NOT NULL,
    total_cost   INTEGER,
    notes        TEXT,
    created_at   TEXT DEFAULT (datetime('now')),
    FOREIGN KEY(user_id) REFERENCES users(id)
  );

  CREATE TABLE IF NOT EXISTS contacts (
    id        INTEGER PRIMARY KEY AUTOINCREMENT,
    name      TEXT NOT NULL,
    email     TEXT NOT NULL,
    subject   TEXT,
    message   TEXT NOT NULL,
    created_at TEXT DEFAULT (datetime('now'))
  );
`);

/* ── MIDDLEWARE ── */
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());
app.use(express.static(path.join(__dirname, 'public')));

/* ── AUTH HELPER ── */
function authMiddleware(req, res, next) {
  const token = req.cookies.token || req.headers['authorization']?.split(' ')[1];
  if (!token) return res.status(401).json({ ok: false, message: 'Not logged in' });
  try {
    req.user = jwt.verify(token, SECRET);
    next();
  } catch {
    res.status(401).json({ ok: false, message: 'Invalid session' });
  }
}

/* ============================================================
   AUTH ROUTES
   ============================================================ */

/* SIGNUP */
app.post('/api/signup', (req, res) => {
  const { name, phone, email, password } = req.body;

  if (!name || !phone || !email || !password)
    return res.json({ ok: false, message: 'All fields are required.' });

  if (password.length < 8)
    return res.json({ ok: false, message: 'Password must be at least 8 characters.' });

  const existing = db.prepare('SELECT id FROM users WHERE email = ?').get(email);
  if (existing)
    return res.json({ ok: false, message: 'An account with this email already exists.' });

  const hashed = bcrypt.hashSync(password, 10);
  const result = db.prepare(
    'INSERT INTO users (name, phone, email, password) VALUES (?, ?, ?, ?)'
  ).run(name, phone, email, hashed);

  const token = jwt.sign({ id: result.lastInsertRowid, name, email }, SECRET, { expiresIn: '7d' });
  res.cookie('token', token, { httpOnly: true, maxAge: 7 * 24 * 60 * 60 * 1000 });
  res.json({ ok: true, message: 'Account created successfully!' });
});

/* LOGIN */
app.post('/api/login', (req, res) => {
  const { email, password } = req.body;

  if (!email || !password)
    return res.json({ ok: false, message: 'Email and password are required.' });

  const user = db.prepare('SELECT * FROM users WHERE email = ?').get(email);
  if (!user)
    return res.json({ ok: false, message: 'No account found with this email.' });

  const match = bcrypt.compareSync(password, user.password);
  if (!match)
    return res.json({ ok: false, message: 'Incorrect password.' });

  const token = jwt.sign({ id: user.id, name: user.name, email: user.email }, SECRET, { expiresIn: '7d' });
  res.cookie('token', token, { httpOnly: true, maxAge: 7 * 24 * 60 * 60 * 1000 });
  res.json({ ok: true, message: 'Login successful!', name: user.name });
});

/* LOGOUT */
app.post('/api/logout', (req, res) => {
  res.clearCookie('token');
  res.json({ ok: true });
});

/* CHECK SESSION */
app.get('/api/me', (req, res) => {
  const token = req.cookies.token;
  if (!token) return res.json({ loggedIn: false });
  try {
    const user = jwt.verify(token, SECRET);
    res.json({ loggedIn: true, name: user.name, email: user.email });
  } catch {
    res.json({ loggedIn: false });
  }
});

/* ============================================================
   APPOINTMENT ROUTES
   ============================================================ */

app.post('/api/appointments', (req, res) => {
  const { patient_name, phone, age, department, doctor, appt_date, appt_time, reason } = req.body;

  if (!patient_name || !phone || !department || !doctor || !appt_date || !appt_time)
    return res.json({ ok: false, message: 'Please fill all required fields.' });

  // Optional: get user_id from cookie if logged in
  let user_id = null;
  const token = req.cookies.token;
  if (token) { try { user_id = jwt.verify(token, SECRET).id; } catch {} }

  db.prepare(`
    INSERT INTO appointments (user_id, patient_name, phone, age, department, doctor, appt_date, appt_time, reason)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
  `).run(user_id, patient_name, phone, age || null, department, doctor, appt_date, appt_time, reason || null);

  res.json({ ok: true, message: 'Appointment booked successfully!' });
});

/* ============================================================
   ROOM BOOKING ROUTES
   ============================================================ */

app.post('/api/rooms', (req, res) => {
  const { patient_name, phone, room_type, price_per_day, check_in, num_days, notes } = req.body;

  if (!patient_name || !phone || !room_type || !check_in || !num_days)
    return res.json({ ok: false, message: 'Please fill all required fields.' });

  const total_cost = (price_per_day || 0) * num_days;
  let user_id = null;
  const token = req.cookies.token;
  if (token) { try { user_id = jwt.verify(token, SECRET).id; } catch {} }

  db.prepare(`
    INSERT INTO room_bookings (user_id, patient_name, phone, room_type, price_per_day, check_in, num_days, total_cost, notes)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
  `).run(user_id, patient_name, phone, room_type, price_per_day || 0, check_in, num_days, total_cost, notes || null);

  res.json({ ok: true, message: 'Room booked successfully!' });
});

/* ============================================================
   CONTACT ROUTES
   ============================================================ */

app.post('/api/contact', (req, res) => {
  const { name, email, subject, message } = req.body;

  if (!name || !email || !message)
    return res.json({ ok: false, message: 'Name, email and message are required.' });

  db.prepare(
    'INSERT INTO contacts (name, email, subject, message) VALUES (?, ?, ?, ?)'
  ).run(name, email, subject || null, message);

  res.json({ ok: true, message: 'Message sent successfully!' });
});

/* ============================================================
   START SERVER
   ============================================================ */
app.listen(PORT, () => {
  console.log(`✅ MEDI SYNC running at http://localhost:${PORT}`);
  console.log(`📁 Database: ./db/medisync.db`);
});