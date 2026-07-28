import { useEffect, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { addBook, listBooks, removeBook, searchBooks, updateBook } from '../api';
import { GENRES, genreInfo } from '../genres';
import './Shelves.css';

const SHELVES = [
  { id: 'want_to_read', label: 'Want to Read' },
  { id: 'reading', label: 'Currently Reading' },
  { id: 'finished', label: 'Finished' },
];
const SHELF_IDS = SHELVES.map((s) => s.id);

const EMPTY_MANUAL_BOOK = { title: '', author: '', isbn: '', publisher: '', cover_url: '', genre: '' };

export default function Shelves({ token }) {
  const [books, setBooks] = useState([]);
  const [searchParams, setSearchParams] = useSearchParams();
  const shelfParam = searchParams.get('shelf');
  const [activeShelf, setActiveShelf] = useState(SHELF_IDS.includes(shelfParam) ? shelfParam : 'want_to_read');
  const [query, setQuery] = useState('');
  const [results, setResults] = useState([]);
  const [searching, setSearching] = useState(false);
  const [searched, setSearched] = useState(false);
  const [error, setError] = useState('');

  const [showManualForm, setShowManualForm] = useState(false);
  const [manualBook, setManualBook] = useState(EMPTY_MANUAL_BOOK);
  const [manualError, setManualError] = useState('');
  const [manualSaving, setManualSaving] = useState(false);

  useEffect(() => {
    refreshBooks();
  }, []);

  useEffect(() => {
    if (SHELF_IDS.includes(shelfParam) && shelfParam !== activeShelf) {
      setActiveShelf(shelfParam);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [shelfParam]);

  async function refreshBooks() {
    try {
      const { books } = await listBooks(token);
      setBooks(books);
    } catch (err) {
      setError(err.message);
    }
  }

  async function handleSearch(e) {
    e.preventDefault();
    if (!query.trim()) return;
    setSearching(true);
    setError('');
    try {
      const { results } = await searchBooks(token, query);
      setResults(results);
      setSearched(true);
    } catch (err) {
      setError(err.message);
    } finally {
      setSearching(false);
    }
  }

  async function handleAdd(result, status) {
    try {
      await addBook(token, { ...result, status });
      setResults([]);
      setQuery('');
      setSearched(false);
      await refreshBooks();
    } catch (err) {
      setError(err.message);
    }
  }

  function openManualForm() {
    setManualBook({ ...EMPTY_MANUAL_BOOK, title: searched ? query : '' });
    setManualError('');
    setShowManualForm(true);
  }

  function handleManualChange(field, value) {
    setManualBook((prev) => ({ ...prev, [field]: value }));
  }

  async function handleManualAdd(status) {
    if (!manualBook.title.trim()) {
      setManualError('Title is required');
      return;
    }
    setManualSaving(true);
    setManualError('');
    try {
      await addBook(token, { ...manualBook, status });
      setManualBook(EMPTY_MANUAL_BOOK);
      setShowManualForm(false);
      setResults([]);
      setQuery('');
      setSearched(false);
      await refreshBooks();
    } catch (err) {
      setManualError(err.message);
    } finally {
      setManualSaving(false);
    }
  }

  async function handleMove(bookId, status) {
    try {
      await updateBook(token, bookId, { status });
      await refreshBooks();
    } catch (err) {
      setError(err.message);
    }
  }

  async function handleGenre(bookId, genre) {
    try {
      await updateBook(token, bookId, { genre });
      await refreshBooks();
    } catch (err) {
      setError(err.message);
    }
  }

  async function handleRemove(bookId) {
    try {
      await removeBook(token, bookId);
      await refreshBooks();
    } catch (err) {
      setError(err.message);
    }
  }

  const shelfBooks = books.filter((b) => b.status === activeShelf);

  return (
    <div className="shelves">
      <form className="search-row" onSubmit={handleSearch}>
        <input
          type="text"
          placeholder="Search by title or author…"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
        />
        <button type="submit" disabled={searching}>
          {searching ? 'Searching…' : 'Search'}
        </button>
      </form>

      {error && <p className="shelves-error" role="alert">{error}</p>}

      {results.length > 0 && (
        <ul className="results">
          {results.map((r, i) => (
            <li key={i} className="result-row">
              {r.cover_url ? (
                <img src={r.cover_url} alt="" className="result-cover" />
              ) : (
                <div className="result-cover result-cover--blank" />
              )}
              <div className="result-info">
                <div className="result-title">{r.title}</div>
                <div className="result-author">{r.author || 'Unknown author'}</div>
              </div>
              <div className="result-add-options">
                {SHELVES.map((s) => (
                  <button key={s.id} type="button" onClick={() => handleAdd(r, s.id)}>
                    + {s.label}
                  </button>
                ))}
              </div>
            </li>
          ))}
        </ul>
      )}

      {searched && results.length === 0 && !showManualForm && (
        <p className="no-results">
          No matches for &ldquo;{query}&rdquo;.{' '}
          <button type="button" className="link-button" onClick={openManualForm}>
            Add it manually
          </button>
        </p>
      )}

      {!showManualForm && (
        <button type="button" className="manual-add-toggle" onClick={openManualForm}>
          Can&rsquo;t find your book? Add it manually
        </button>
      )}

      {showManualForm && (
        <div className="manual-form">
          <div className="manual-form-head">
            <h3>Add a book manually</h3>
            <button type="button" className="link-button" onClick={() => setShowManualForm(false)}>
              Cancel
            </button>
          </div>

          <div className="field-row">
            <div className="field">
              <label htmlFor="manual-title">Title</label>
              <input
                id="manual-title"
                type="text"
                value={manualBook.title}
                onChange={(e) => handleManualChange('title', e.target.value)}
                placeholder="Title"
                required
              />
            </div>
            <div className="field">
              <label htmlFor="manual-author">Author</label>
              <input
                id="manual-author"
                type="text"
                value={manualBook.author}
                onChange={(e) => handleManualChange('author', e.target.value)}
                placeholder="Author"
              />
            </div>
          </div>

          <div className="field-row">
            <div className="field">
              <label htmlFor="manual-isbn">ISBN</label>
              <input
                id="manual-isbn"
                type="text"
                value={manualBook.isbn}
                onChange={(e) => handleManualChange('isbn', e.target.value)}
                placeholder="978…"
              />
            </div>
            <div className="field">
              <label htmlFor="manual-publisher">Publisher</label>
              <input
                id="manual-publisher"
                type="text"
                value={manualBook.publisher}
                onChange={(e) => handleManualChange('publisher', e.target.value)}
                placeholder="Publisher"
              />
            </div>
          </div>

          <div className="field-row">
            <div className="field">
              <label htmlFor="manual-cover">Cover image URL</label>
              <input
                id="manual-cover"
                type="text"
                value={manualBook.cover_url}
                onChange={(e) => handleManualChange('cover_url', e.target.value)}
                placeholder="https://…"
              />
            </div>
            <div className="field">
              <label htmlFor="manual-genre">Genre</label>
              <select
                id="manual-genre"
                value={manualBook.genre}
                onChange={(e) => handleManualChange('genre', e.target.value)}
              >
                {GENRES.map((g) => (
                  <option key={g.value} value={g.value}>{g.label}</option>
                ))}
              </select>
            </div>
          </div>

          {manualBook.cover_url && (
            <img src={manualBook.cover_url} alt="" className="manual-cover-preview" />
          )}

          {manualError && <p className="shelves-error" role="alert">{manualError}</p>}

          <div className="result-add-options">
            {SHELVES.map((s) => (
              <button
                key={s.id}
                type="button"
                onClick={() => handleManualAdd(s.id)}
                disabled={manualSaving}
              >
                + {s.label}
              </button>
            ))}
          </div>
        </div>
      )}

      <div className="shelf-tabs" role="tablist">
        {SHELVES.map((s) => (
          <button
            key={s.id}
            className="shelf-tab"
            role="tab"
            aria-selected={activeShelf === s.id}
            onClick={() => { setActiveShelf(s.id); setSearchParams({ shelf: s.id }); }}
            type="button"
          >
            {s.label}
            <span className="count">{books.filter((b) => b.status === s.id).length}</span>
          </button>
        ))}
      </div>

      {shelfBooks.length === 0 ? (
        <p className="empty-state">No books here yet. Search above to add one.</p>
      ) : (
        <ul className="book-grid">
          {shelfBooks.map((book) => (
            <li key={book.id} className="book-card">
              {book.cover_url ? (
                <img src={book.cover_url} alt="" className="book-cover" />
              ) : (
                <div className="book-cover book-cover--blank" />
              )}
              <Link to={`/books/${book.id}`} className="book-title book-title-link">{book.title}</Link>
              <div className="book-author">{book.author || 'Unknown author'}</div>

              <div className="genre-select">
                <span className="genre-dot" style={{ background: genreInfo(book.genre).color }} />
                <select
                  value={book.genre || ''}
                  onChange={(e) => handleGenre(book.id, e.target.value)}
                >
                  {GENRES.map((g) => (
                    <option key={g.value} value={g.value}>{g.label}</option>
                  ))}
                </select>
              </div>

              <div className="book-actions">
                <select
                  value={book.status}
                  onChange={(e) => handleMove(book.id, e.target.value)}
                >
                  {SHELVES.map((s) => (
                    <option key={s.id} value={s.id}>{s.label}</option>
                  ))}
                </select>
                <Link to={`/books/${book.id}`} className="view-details">
                  View details
                </Link>
                <button type="button" className="remove" onClick={() => handleRemove(book.id)}>
                  Remove
                </button>
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
