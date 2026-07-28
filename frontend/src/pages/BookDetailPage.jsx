import { useEffect, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import {
  addNote, addReadingSession, getBook, listNotes, listReadingSessions,
  removeBook, removeNote, removeReadingSession, updateBook,
} from '../api';
import { GENRES, genreInfo } from '../genres';
import DateFields from '../components/DateFields';
import './BookDetailPage.css';

const SHELVES = [
  { id: 'want_to_read', label: 'Want to Read' },
  { id: 'reading', label: 'Currently Reading' },
  { id: 'finished', label: 'Finished' },
];
const CURRENT_YEAR = new Date().getFullYear();

function todayISO() {
  const d = new Date();
  const mm = String(d.getMonth() + 1).padStart(2, '0');
  const dd = String(d.getDate()).padStart(2, '0');
  return `${d.getFullYear()}-${mm}-${dd}`;
}

function formatSessionDate(value) {
  const [year, month, day] = value.slice(0, 10).split('-').map(Number);
  return new Date(year, month - 1, day).toLocaleDateString(undefined, {
    year: 'numeric', month: 'short', day: 'numeric',
  });
}

function formatNoteDate(value) {
  return new Date(value).toLocaleDateString(undefined, {
    year: 'numeric', month: 'short', day: 'numeric',
  });
}

const EMPTY_SESSION_DRAFT = { pages_read: '', minutes_spent: '', session_date: todayISO() };
const EMPTY_NOTE_DRAFT = { content: '', tag: '', page_number: '' };

export default function BookDetailPage({ token }) {
  const { id } = useParams();
  const navigate = useNavigate();

  const [book, setBook] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [reviewDraft, setReviewDraft] = useState('');

  const [sessions, setSessions] = useState([]);
  const [sessionDraft, setSessionDraft] = useState(EMPTY_SESSION_DRAFT);
  const [sessionError, setSessionError] = useState('');
  const [sessionSaving, setSessionSaving] = useState(false);

  const [notes, setNotes] = useState([]);
  const [noteDraft, setNoteDraft] = useState(EMPTY_NOTE_DRAFT);
  const [noteError, setNoteError] = useState('');
  const [noteSaving, setNoteSaving] = useState(false);

  useEffect(() => {
    refresh();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  async function refresh() {
    setLoading(true);
    setError('');
    try {
      const [bookRes, sessionsRes, notesRes] = await Promise.all([
        getBook(token, id),
        listReadingSessions(token, id),
        listNotes(token, id),
      ]);
      setBook(bookRes.book);
      setReviewDraft(bookRes.book.review || '');
      setSessions(sessionsRes.sessions);
      setNotes(notesRes.notes);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  async function handleField(changes) {
    try {
      const { book: updated } = await updateBook(token, id, changes);
      setBook(updated);
    } catch (err) {
      setError(err.message);
    }
  }

  function handleReviewSave() {
    if (reviewDraft === (book.review || '')) return;
    handleField({ review: reviewDraft });
  }

  async function handleSaveAndReturn() {
    setError('');
    try {
      if (reviewDraft !== (book.review || '')) {
        const { book: updated } = await updateBook(token, id, { review: reviewDraft });
        setBook(updated);
      }
      navigate('/library');
    } catch (err) {
      setError(err.message);
    }
  }

  async function handleAddSession() {
    if (!sessionDraft.pages_read && !sessionDraft.minutes_spent) {
      setSessionError('Enter pages read or minutes spent');
      return;
    }
    setSessionSaving(true);
    setSessionError('');
    try {
      await addReadingSession(token, id, {
        pages_read: sessionDraft.pages_read || null,
        minutes_spent: sessionDraft.minutes_spent || null,
        session_date: sessionDraft.session_date,
      });
      const { sessions } = await listReadingSessions(token, id);
      setSessions(sessions);
      setSessionDraft(EMPTY_SESSION_DRAFT);
    } catch (err) {
      setSessionError(err.message);
    } finally {
      setSessionSaving(false);
    }
  }

  async function handleRemoveSession(sessionId) {
    setSessionError('');
    try {
      await removeReadingSession(token, id, sessionId);
      const { sessions } = await listReadingSessions(token, id);
      setSessions(sessions);
    } catch (err) {
      setSessionError(err.message);
    }
  }

  async function handleAddNote() {
    if (!noteDraft.content.trim()) {
      setNoteError('Note content is required');
      return;
    }
    setNoteSaving(true);
    setNoteError('');
    try {
      await addNote(token, id, {
        content: noteDraft.content,
        tag: noteDraft.tag || null,
        page_number: noteDraft.page_number || null,
      });
      const { notes } = await listNotes(token, id);
      setNotes(notes);
      setNoteDraft(EMPTY_NOTE_DRAFT);
    } catch (err) {
      setNoteError(err.message);
    } finally {
      setNoteSaving(false);
    }
  }

  async function handleRemoveNote(noteId) {
    setNoteError('');
    try {
      await removeNote(token, id, noteId);
      const { notes } = await listNotes(token, id);
      setNotes(notes);
    } catch (err) {
      setNoteError(err.message);
    }
  }

  async function handleRemoveBook() {
    try {
      await removeBook(token, id);
      navigate('/library');
    } catch (err) {
      setError(err.message);
    }
  }

  if (loading) {
    return (
      <div className="book-detail">
        <p className="home-empty">Loading…</p>
      </div>
    );
  }

  if (!book) {
    return (
      <div className="book-detail">
        {error && <p className="shelves-error" role="alert">{error}</p>}
        <Link to="/library" className="book-detail-back">&larr; Back to Library</Link>
      </div>
    );
  }

  return (
    <div className="book-detail">
      <Link to="/library" className="book-detail-back">&larr; Back to Library</Link>

      {error && <p className="shelves-error" role="alert">{error}</p>}

      <div className="book-detail-header">
        {book.cover_url ? (
          <img src={book.cover_url} alt="" className="book-detail-cover" />
        ) : (
          <div className="book-detail-cover book-detail-cover--blank" />
        )}
        <div className="book-detail-info">
          <h1>{book.title}</h1>
          <p className="book-detail-author">{book.author || 'Unknown author'}</p>

          {(book.isbn || book.publisher) && (
            <dl className="book-detail-meta">
              {book.isbn && (
                <div>
                  <dt>ISBN</dt>
                  <dd>{book.isbn}</dd>
                </div>
              )}
              {book.publisher && (
                <div>
                  <dt>Publisher</dt>
                  <dd>{book.publisher}</dd>
                </div>
              )}
            </dl>
          )}

          <div className="book-detail-controls">
            <label className="book-detail-field">
              <span>Status</span>
              <select value={book.status} onChange={(e) => handleField({ status: e.target.value })}>
                {SHELVES.map((s) => (
                  <option key={s.id} value={s.id}>{s.label}</option>
                ))}
              </select>
            </label>
            <label className="book-detail-field">
              <span>Genre</span>
              <div className="genre-select">
                <span className="genre-dot" style={{ background: genreInfo(book.genre).color }} />
                <select value={book.genre || ''} onChange={(e) => handleField({ genre: e.target.value })}>
                  {GENRES.map((g) => (
                    <option key={g.value} value={g.value}>{g.label}</option>
                  ))}
                </select>
              </div>
            </label>
          </div>

          <button type="button" className="book-detail-remove" onClick={handleRemoveBook}>
            Remove from library
          </button>
        </div>
      </div>

      {book.status === 'finished' && (
        <section className="book-detail-section">
          <h2>Your rating &amp; review</h2>
          <div className="stars" role="radiogroup" aria-label="Rating">
            {[1, 2, 3, 4, 5].map((n) => (
              <button
                key={n}
                type="button"
                className={`star ${book.rating >= n ? 'star--filled' : ''}`}
                aria-checked={book.rating === n}
                role="radio"
                onClick={() => handleField({ rating: n })}
              >
                ★
              </button>
            ))}
          </div>
          <textarea
            className="review-field"
            placeholder="Write a review…"
            value={reviewDraft}
            onChange={(e) => setReviewDraft(e.target.value)}
            onBlur={handleReviewSave}
          />
        </section>
      )}

      {book.status !== 'want_to_read' && (
        <section className="book-detail-section">
          <h2>Reading log</h2>
          {sessionError && <p className="shelves-error" role="alert">{sessionError}</p>}
          <div className="session-form">
            <div className="session-form-inputs">
              <label className="session-input">
                <span>Pages</span>
                <input
                  type="number"
                  min="0"
                  inputMode="numeric"
                  value={sessionDraft.pages_read}
                  onChange={(e) => setSessionDraft((p) => ({ ...p, pages_read: e.target.value }))}
                />
              </label>
              <label className="session-input">
                <span>Minutes</span>
                <input
                  type="number"
                  min="0"
                  inputMode="numeric"
                  value={sessionDraft.minutes_spent}
                  onChange={(e) => setSessionDraft((p) => ({ ...p, minutes_spent: e.target.value }))}
                />
              </label>
              <DateFields
                idPrefix="session"
                value={sessionDraft.session_date}
                onChange={(value) => setSessionDraft((p) => ({ ...p, session_date: value }))}
                minYear={1900}
                maxYear={CURRENT_YEAR}
                compact
              />
            </div>
            <button type="button" className="session-add" onClick={handleAddSession} disabled={sessionSaving}>
              {sessionSaving ? 'Adding…' : 'Add session'}
            </button>
          </div>

          {sessions.length > 0 && (
            <ul className="session-list">
              {sessions.map((s) => (
                <li key={s.id} className="session-row">
                  <span className="session-date">{formatSessionDate(s.session_date)}</span>
                  <span className="session-stat">{s.pages_read != null ? `${s.pages_read}p` : '—'}</span>
                  <span className="session-stat">{s.minutes_spent != null ? `${s.minutes_spent}m` : '—'}</span>
                  <button
                    type="button"
                    className="session-remove"
                    onClick={() => handleRemoveSession(s.id)}
                    aria-label="Remove session"
                  >
                    ×
                  </button>
                </li>
              ))}
            </ul>
          )}
        </section>
      )}

      <section className="book-detail-section">
        <h2>Notes &amp; quotes</h2>
        {noteError && <p className="shelves-error" role="alert">{noteError}</p>}

        <div className="note-form">
          <textarea
            className="note-content-field"
            placeholder="Jot a quote or note…"
            value={noteDraft.content}
            onChange={(e) => setNoteDraft((p) => ({ ...p, content: e.target.value }))}
          />
          <div className="note-form-inputs">
            <input
              type="text"
              className="note-tag-field"
              placeholder="Tag (optional)"
              value={noteDraft.tag}
              onChange={(e) => setNoteDraft((p) => ({ ...p, tag: e.target.value }))}
            />
            <input
              type="number"
              min="0"
              inputMode="numeric"
              className="note-page-field"
              placeholder="Page"
              value={noteDraft.page_number}
              onChange={(e) => setNoteDraft((p) => ({ ...p, page_number: e.target.value }))}
            />
            <button type="button" className="note-add" onClick={handleAddNote} disabled={noteSaving}>
              {noteSaving ? 'Adding…' : 'Add note'}
            </button>
          </div>
        </div>

        {notes.length === 0 ? (
          <p className="home-empty">No notes yet.</p>
        ) : (
          <ul className="note-list">
            {notes.map((n) => (
              <li key={n.id} className="note-row">
                <div className="note-row-head">
                  {n.tag && <span className="note-tag">{n.tag}</span>}
                  {n.page_number != null && <span className="note-page">p. {n.page_number}</span>}
                  <span className="note-date">{formatNoteDate(n.created_at)}</span>
                  <button
                    type="button"
                    className="note-remove"
                    onClick={() => handleRemoveNote(n.id)}
                    aria-label="Remove note"
                  >
                    ×
                  </button>
                </div>
                <p className="note-content">{n.content}</p>
              </li>
            ))}
          </ul>
        )}
      </section>

      <button type="button" className="book-detail-save" onClick={handleSaveAndReturn}>
        Save &amp; return to Library
      </button>
    </div>
  );
}
