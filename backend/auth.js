const express = require('express');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const pool = require('./db');
const requireAuth = require('./middleware/auth');

const router = express.Router();
const SALT_ROUNDS = 10;
const PROFILE_FIELDS = 'id, email, name, date_of_birth, gender, country, reading_goal, reading_goal_year, theme, created_at';

router.post('/signup', async (req, res) => {
  const { email, password } = req.body;
  if (!email || !password) {
    return res.status(400).json({ error: 'Email and password are required' });
  }

  try {
    const passwordHash = await bcrypt.hash(password, SALT_ROUNDS);
    const result = await pool.query(
      `INSERT INTO users (email, password_hash) VALUES ($1, $2) RETURNING ${PROFILE_FIELDS}`,
      [email, passwordHash]
    );

    const user = result.rows[0];
    const token = jwt.sign({ userId: user.id, email: user.email }, process.env.JWT_SECRET, {
      expiresIn: '7d',
    });

    res.status(201).json({ user, token });
  } catch (err) {
    if (err.code === '23505') {
      return res.status(409).json({ error: 'Email already in use' });
    }
    console.error(err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

router.post('/login', async (req, res) => {
  const { email, password } = req.body;
  if (!email || !password) {
    return res.status(400).json({ error: 'Email and password are required' });
  }

  try {
    const result = await pool.query(
      `SELECT ${PROFILE_FIELDS}, password_hash FROM users WHERE email = $1`,
      [email]
    );
    const user = result.rows[0];
    if (!user) {
      return res.status(401).json({ error: 'Invalid email or password' });
    }

    const match = await bcrypt.compare(password, user.password_hash);
    if (!match) {
      return res.status(401).json({ error: 'Invalid email or password' });
    }

    const token = jwt.sign({ userId: user.id, email: user.email }, process.env.JWT_SECRET, {
      expiresIn: '7d',
    });

    const { password_hash, ...profile } = user;
    res.json({ user: profile, token });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

router.get('/me', requireAuth, async (req, res) => {
  try {
    const result = await pool.query(`SELECT ${PROFILE_FIELDS} FROM users WHERE id = $1`, [req.userId]);
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'User not found' });
    }
    res.json({ user: result.rows[0] });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

router.patch('/me', requireAuth, async (req, res) => {
  const { name, email, date_of_birth, gender, country, reading_goal, reading_goal_year, theme } = req.body;

  if (email !== undefined && !email) {
    return res.status(400).json({ error: 'Email cannot be empty' });
  }

  if (reading_goal !== undefined && reading_goal !== null && (!Number.isInteger(reading_goal) || reading_goal < 1)) {
    return res.status(400).json({ error: 'Reading goal must be a positive whole number' });
  }

  try {
    const result = await pool.query(
      `UPDATE users SET
         name = COALESCE($1, name),
         email = COALESCE($2, email),
         date_of_birth = COALESCE($3, date_of_birth),
         gender = COALESCE($4, gender),
         country = COALESCE($5, country),
         reading_goal = COALESCE($7, reading_goal),
         reading_goal_year = COALESCE($8, reading_goal_year),
         theme = COALESCE($9, theme)
       WHERE id = $6
       RETURNING ${PROFILE_FIELDS}`,
      [
        name ?? null,
        email ?? null,
        date_of_birth || null,
        gender ?? null,
        country ?? null,
        req.userId,
        reading_goal ?? null,
        reading_goal_year ?? null,
        theme || null,
      ]
    );
    res.json({ user: result.rows[0] });
  } catch (err) {
    if (err.code === '23505') {
      return res.status(409).json({ error: 'Email already in use' });
    }
    console.error(err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

router.post('/me/password', requireAuth, async (req, res) => {
  const { currentPassword, newPassword } = req.body;

  if (!currentPassword || !newPassword) {
    return res.status(400).json({ error: 'Current and new password are required' });
  }
  if (newPassword.length < 8) {
    return res.status(400).json({ error: 'New password must be at least 8 characters' });
  }

  try {
    const result = await pool.query('SELECT password_hash FROM users WHERE id = $1', [req.userId]);
    const user = result.rows[0];

    const match = await bcrypt.compare(currentPassword, user.password_hash);
    if (!match) {
      return res.status(401).json({ error: 'Current password is incorrect' });
    }

    const passwordHash = await bcrypt.hash(newPassword, SALT_ROUNDS);
    await pool.query('UPDATE users SET password_hash = $1 WHERE id = $2', [passwordHash, req.userId]);
    res.json({ ok: true });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

module.exports = router;
