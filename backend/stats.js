const express = require('express');
const pool = require('./db');
const requireAuth = require('./middleware/auth');

const router = express.Router();

router.use(requireAuth);

router.get('/reading', async (req, res) => {
  try {
    const totals = await pool.query(
      `SELECT
         COALESCE(SUM(rs.pages_read), 0)::int AS total_pages,
         COALESCE(SUM(rs.minutes_spent), 0)::int AS total_minutes,
         COUNT(*)::int AS session_count
       FROM reading_sessions rs
       JOIN books b ON b.id = rs.book_id
       WHERE b.user_id = $1`,
      [req.userId]
    );

    const daily = await pool.query(
      `SELECT rs.session_date,
              COALESCE(SUM(rs.pages_read), 0)::int AS pages,
              COALESCE(SUM(rs.minutes_spent), 0)::int AS minutes
       FROM reading_sessions rs
       JOIN books b ON b.id = rs.book_id
       WHERE b.user_id = $1 AND rs.session_date >= CURRENT_DATE - INTERVAL '29 days'
       GROUP BY rs.session_date
       ORDER BY rs.session_date ASC`,
      [req.userId]
    );

    const activeDays = await pool.query(
      `SELECT DISTINCT rs.session_date
       FROM reading_sessions rs
       JOIN books b ON b.id = rs.book_id
       WHERE b.user_id = $1`,
      [req.userId]
    );

    const recent = await pool.query(
      `SELECT rs.id, rs.session_date, rs.pages_read, rs.minutes_spent, b.id AS book_id, b.title
       FROM reading_sessions rs
       JOIN books b ON b.id = rs.book_id
       WHERE b.user_id = $1
       ORDER BY rs.session_date DESC, rs.id DESC
       LIMIT 8`,
      [req.userId]
    );

    res.json({
      totalPages: totals.rows[0].total_pages,
      totalMinutes: totals.rows[0].total_minutes,
      sessionCount: totals.rows[0].session_count,
      daily: daily.rows,
      activeDays: activeDays.rows.map((r) => r.session_date),
      recent: recent.rows,
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

module.exports = router;
