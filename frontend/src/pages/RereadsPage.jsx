import { useEffect, useState } from 'react';
import { listBooks, logReread, removeReread, updateBook } from '../api';
import DateFields from '../components/DateFields';
import './RereadsPage.css';

const CURRENT_YEAR = new Date().getFullYear();

export default function RereadsPage({ token }) {
  const [books, setBooks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [busyId, setBusyId] = useState(null);

  useEffect(() => {
    refresh();
  }, []);

  async function refresh() {
    try {
      const { books } = await listBooks(token);
      setBooks(books.filter((b) => b.status === 'finished'));
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  async function handleReread(id) {
    setBusyId(id);
    try {
      await logReread(token, id);
      await refresh();
    } catch (err) {
      setError(err.message);
    } finally {
      setBusyId(null);
    }
  }

  async function handleUndoReread(id) {
    setBusyId(id);
    try {
      await removeReread(token, id);
      await refresh();
    } catch (err) {
      setError(err.message);
    } finally {
      setBusyId(null);
    }
  }

  async function handleFirstFinishedChange(id, value) {
    if (!value) return;
    setBusyId(id);
    try {
      await updateBook(token, id, { first_finished_at: value });
      await refresh();
    } catch (err) {
      setError(err.message);
    } finally {
      setBusyId(null);
    }
  }

  async function handleLastFinishedChange(id, value) {
    if (!value) return;
    setBusyId(id);
    try {
      await updateBook(token, id, { last_finished_at: value });
      await refresh();
    } catch (err) {
      setError(err.message);
    } finally {
      setBusyId(null);
    }
  }

  return (
    <div className="rereads-page">
      <h1>Re-reads</h1>
      <p className="rereads-sub">Every finished book, and how many times you've come back to it.</p>

      {error && <p className="rereads-error" role="alert">{error}</p>}

      {!loading && (
        books.length === 0 ? (
          <p className="rereads-empty">Finish a book in the Library Nook to see it here.</p>
        ) : (
          <div className="rereads-table-wrap">
            <table className="rereads-table">
              <thead>
                <tr>
                  <th>Book</th>
                  <th>Times read</th>
                  <th>First finished</th>
                  <th>Last finished</th>
                  <th></th>
                </tr>
              </thead>
              <tbody>
                {books.map((b) => (
                  <tr key={b.id}>
                    <td>
                      <div className="rereads-book">
                        {b.cover_url ? (
                          <img src={b.cover_url} alt="" className="rereads-cover" />
                        ) : (
                          <div className="rereads-cover rereads-cover--blank" />
                        )}
                        <div>
                          <div className="rereads-title">{b.title}</div>
                          <div className="rereads-author">{b.author || 'Unknown author'}</div>
                        </div>
                      </div>
                    </td>
                    <td className="rereads-count">{b.times_read}</td>
                    <td className="rereads-date-cell">
                      <DateFields
                        idPrefix={`first-${b.id}`}
                        value={b.first_finished_at}
                        onChange={(value) => handleFirstFinishedChange(b.id, value)}
                        minYear={1900}
                        maxYear={CURRENT_YEAR}
                        compact
                      />
                    </td>
                    <td className="rereads-date-cell">
                      <DateFields
                        idPrefix={`last-${b.id}`}
                        value={b.last_finished_at}
                        onChange={(value) => handleLastFinishedChange(b.id, value)}
                        minYear={1900}
                        maxYear={CURRENT_YEAR}
                        compact
                      />
                    </td>
                    <td>
                      <div className="rereads-actions">
                        <button
                          type="button"
                          className="rereads-log"
                          onClick={() => handleReread(b.id)}
                          disabled={busyId === b.id}
                        >
                          {busyId === b.id ? 'Working…' : 'Log a re-read'}
                        </button>
                        <button
                          type="button"
                          className="rereads-undo"
                          onClick={() => handleUndoReread(b.id)}
                          disabled={busyId === b.id || b.times_read <= 1}
                          title="Remove the most recently logged re-read"
                        >
                          Undo last
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )
      )}
    </div>
  );
}
