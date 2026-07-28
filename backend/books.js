const express = require('express');
const pool = require('./db');
const requireAuth = require('./middleware/auth');

const router = express.Router();
const STATUSES = ['want_to_read', 'reading', 'finished'];
const GENRES = [
  '', 'fiction', 'non-fiction', 'fantasy', 'sci-fi', 'romance', 'mystery-thriller',
  'horror', 'biography', 'self-help', 'history', 'young-adult', 'poetry',
];
const BOOK_FIELDS = 'id, title, author, cover_url, isbn, publisher, status, rating, review, genre, added_at, times_read, first_finished_at, last_finished_at';

router.use(requireAuth);

router.get('/search', async (req, res) => {
  const q = req.query.q;
  if (!q) {
    return res.status(400).json({ error: 'Query parameter q is required' });
  }

  try {
    const url = `https://openlibrary.org/search.json?q=${encodeURIComponent(q)}&limit=30&fields=title,author_name,isbn,cover_i,first_publish_year`;
    const olRes = await fetch(url);
    const data = await olRes.json();

    const results = (data.docs || []).map((doc) => ({
      title: doc.title,
      author: doc.author_name ? doc.author_name[0] : null,
      isbn: doc.isbn ? doc.isbn[0] : null,
      cover_url: doc.cover_i ? `https://covers.openlibrary.org/b/id/${doc.cover_i}-M.jpg` : null,
      first_publish_year: doc.first_publish_year || null,
    }));

    res.json({ results });
  } catch (err) {
    console.error(err);
    res.status(502).json({ error: 'Book lookup failed' });
  }
});

router.get('/', async (req, res) => {
  try {
    const result = await pool.query(
      `SELECT ${BOOK_FIELDS} FROM books WHERE user_id = $1 ORDER BY added_at DESC`,
      [req.userId]
    );
    res.json({ books: result.rows });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

router.get('/:id', async (req, res) => {
  try {
    const result = await pool.query(
      `SELECT ${BOOK_FIELDS} FROM books WHERE id = $1 AND user_id = $2`,
      [req.params.id, req.userId]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Book not found' });
    }

    res.json({ book: result.rows[0] });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

router.post('/', async (req, res) => {
  const { title, author, isbn, cover_url, publisher, status, genre } = req.body;

  if (!title) {
    return res.status(400).json({ error: 'Title is required' });
  }

  if (genre !== undefined && genre && !GENRES.includes(genre)) {
    return res.status(400).json({ error: `Genre must be one of: ${GENRES.filter(Boolean).join(', ')}` });
  }

  const shelfStatus = STATUSES.includes(status) ? status : 'want_to_read';
  const finishedNow = shelfStatus === 'finished';

  try {
    const result = await pool.query(
      `INSERT INTO books (user_id, title, author, cover_url, isbn, publisher, status, genre, times_read, first_finished_at, last_finished_at)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9,
         CASE WHEN $7 = 'finished' THEN NOW() ELSE NULL END,
         CASE WHEN $7 = 'finished' THEN NOW() ELSE NULL END)
       RETURNING ${BOOK_FIELDS}`,
      [
        req.userId,
        title,
        author || null,
        cover_url || null,
        isbn || null,
        publisher || null,
        shelfStatus,
        genre || null,
        finishedNow ? 1 : 0,
      ]
    );
    res.status(201).json({ book: result.rows[0] });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

router.patch('/:id', async (req, res) => {
  const { status, rating, review, first_finished_at, last_finished_at, genre, publisher } = req.body;

  if (status !== undefined && !STATUSES.includes(status)) {
    return res.status(400).json({ error: `Status must be one of: ${STATUSES.join(', ')}` });
  }

  if (rating !== undefined && (rating < 1 || rating > 5)) {
    return res.status(400).json({ error: 'Rating must be between 1 and 5' });
  }

  if (first_finished_at !== undefined && first_finished_at && isNaN(Date.parse(first_finished_at))) {
    return res.status(400).json({ error: 'first_finished_at must be a valid date' });
  }

  if (last_finished_at !== undefined && last_finished_at && isNaN(Date.parse(last_finished_at))) {
    return res.status(400).json({ error: 'last_finished_at must be a valid date' });
  }

  if (genre !== undefined && genre && !GENRES.includes(genre)) {
    return res.status(400).json({ error: `Genre must be one of: ${GENRES.filter(Boolean).join(', ')}` });
  }

  try {
    const result = await pool.query(
      `UPDATE books SET
         status = COALESCE($1, status),
         rating = COALESCE($2, rating),
         genre = CASE WHEN $7 THEN $6 ELSE genre END,
         publisher = CASE WHEN $9 THEN $8 ELSE publisher END,
         review = CASE WHEN $11 THEN $12 ELSE review END,
         times_read = CASE WHEN $1 = 'finished' AND times_read = 0 THEN 1 ELSE times_read END,
         first_finished_at = COALESCE($5::timestamp, CASE WHEN $1 = 'finished' AND times_read = 0 THEN NOW() ELSE first_finished_at END),
         last_finished_at = COALESCE($10::timestamp, CASE WHEN $1 = 'finished' AND times_read = 0 THEN COALESCE($5::timestamp, NOW()) ELSE last_finished_at END)
       WHERE id = $3 AND user_id = $4
       RETURNING ${BOOK_FIELDS}`,
      [
        status || null,
        rating ?? null,
        req.params.id,
        req.userId,
        first_finished_at || null,
        genre || null,
        genre !== undefined,
        publisher || null,
        publisher !== undefined,
        last_finished_at || null,
        review !== undefined,
        review || null,
      ]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Book not found' });
    }

    res.json({ book: result.rows[0] });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

router.post('/:id/reread', async (req, res) => {
  try {
    const result = await pool.query(
      `UPDATE books SET
         times_read = times_read + 1,
         last_finished_at = NOW()
       WHERE id = $1 AND user_id = $2 AND status = 'finished'
       RETURNING ${BOOK_FIELDS}`,
      [req.params.id, req.userId]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Finished book not found' });
    }

    res.json({ book: result.rows[0] });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

router.delete('/:id/reread', async (req, res) => {
  try {
    const result = await pool.query(
      `UPDATE books SET
         times_read = times_read - 1,
         last_finished_at = CASE WHEN times_read - 1 <= 1 THEN first_finished_at ELSE last_finished_at END
       WHERE id = $1 AND user_id = $2 AND status = 'finished' AND times_read > 1
       RETURNING ${BOOK_FIELDS}`,
      [req.params.id, req.userId]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'No re-read to remove for this book' });
    }

    res.json({ book: result.rows[0] });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

router.get('/:id/sessions', async (req, res) => {
  try {
    const result = await pool.query(
      `SELECT rs.id, rs.book_id, rs.pages_read, rs.minutes_spent, rs.session_date
       FROM reading_sessions rs
       JOIN books b ON b.id = rs.book_id
       WHERE rs.book_id = $1 AND b.user_id = $2
       ORDER BY rs.session_date DESC, rs.id DESC`,
      [req.params.id, req.userId]
    );
    res.json({ sessions: result.rows });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

router.post('/:id/sessions', async (req, res) => {
  const { pages_read, minutes_spent, session_date } = req.body;

  const pages = pages_read === undefined || pages_read === null || pages_read === '' ? null : Number(pages_read);
  const minutes = minutes_spent === undefined || minutes_spent === null || minutes_spent === '' ? null : Number(minutes_spent);

  if (pages === null && minutes === null) {
    return res.status(400).json({ error: 'Enter pages read or minutes spent' });
  }
  if (pages !== null && (!Number.isInteger(pages) || pages < 0)) {
    return res.status(400).json({ error: 'Pages read must be a non-negative whole number' });
  }
  if (minutes !== null && (!Number.isInteger(minutes) || minutes < 0)) {
    return res.status(400).json({ error: 'Minutes spent must be a non-negative whole number' });
  }
  if (session_date && isNaN(Date.parse(session_date))) {
    return res.status(400).json({ error: 'session_date must be a valid date' });
  }

  try {
    const result = await pool.query(
      `INSERT INTO reading_sessions (book_id, pages_read, minutes_spent, session_date)
       SELECT $1, $2, $3, COALESCE($4::date, CURRENT_DATE)
       WHERE EXISTS (SELECT 1 FROM books WHERE id = $1 AND user_id = $5)
       RETURNING id, book_id, pages_read, minutes_spent, session_date`,
      [req.params.id, pages, minutes, session_date || null, req.userId]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Book not found' });
    }

    res.status(201).json({ session: result.rows[0] });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

router.delete('/:id/sessions/:sessionId', async (req, res) => {
  try {
    const result = await pool.query(
      `DELETE FROM reading_sessions
       WHERE id = $1 AND book_id = $2
         AND EXISTS (SELECT 1 FROM books WHERE id = $2 AND user_id = $3)
       RETURNING id`,
      [req.params.sessionId, req.params.id, req.userId]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Session not found' });
    }

    res.status(204).send();
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

router.get('/:id/notes', async (req, res) => {
  try {
    const result = await pool.query(
      `SELECT n.id, n.book_id, n.content, n.tag, n.page_number, n.created_at
       FROM notes n
       JOIN books b ON b.id = n.book_id
       WHERE n.book_id = $1 AND b.user_id = $2
       ORDER BY n.created_at DESC, n.id DESC`,
      [req.params.id, req.userId]
    );
    res.json({ notes: result.rows });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

router.post('/:id/notes', async (req, res) => {
  const { content, tag, page_number } = req.body;

  if (!content || !content.trim()) {
    return res.status(400).json({ error: 'Note content is required' });
  }

  const pageNumber = page_number === undefined || page_number === null || page_number === '' ? null : Number(page_number);
  if (pageNumber !== null && (!Number.isInteger(pageNumber) || pageNumber < 0)) {
    return res.status(400).json({ error: 'Page number must be a non-negative whole number' });
  }

  try {
    const result = await pool.query(
      `INSERT INTO notes (book_id, content, tag, page_number)
       SELECT $1, $2, $3, $4
       WHERE EXISTS (SELECT 1 FROM books WHERE id = $1 AND user_id = $5)
       RETURNING id, book_id, content, tag, page_number, created_at`,
      [req.params.id, content.trim(), tag || null, pageNumber, req.userId]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Book not found' });
    }

    res.status(201).json({ note: result.rows[0] });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

router.delete('/:id/notes/:noteId', async (req, res) => {
  try {
    const result = await pool.query(
      `DELETE FROM notes
       WHERE id = $1 AND book_id = $2
         AND EXISTS (SELECT 1 FROM books WHERE id = $2 AND user_id = $3)
       RETURNING id`,
      [req.params.noteId, req.params.id, req.userId]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Note not found' });
    }

    res.status(204).send();
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

router.delete('/:id', async (req, res) => {
  try {
    const result = await pool.query(
      'DELETE FROM books WHERE id = $1 AND user_id = $2 RETURNING id',
      [req.params.id, req.userId]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Book not found' });
    }

    res.status(204).send();
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

module.exports = router;
