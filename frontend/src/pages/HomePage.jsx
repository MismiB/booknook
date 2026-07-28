import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { getProfile, getReadingStats, listBooks, updateProfile } from '../api';
import { genreInfo } from '../genres';
import GoalRing from '../components/GoalRing';
import GoalSetupModal from '../components/GoalSetupModal';
import './HomePage.css';

const SHELF_LABELS = {
  want_to_read: 'Want to Read',
  reading: 'Currently Reading',
  finished: 'Finished',
};

const CURRENT_YEAR = new Date().getFullYear();
const CHART_DAYS = 14;

function formatMinutes(total) {
  if (!total) return '0m';
  const h = Math.floor(total / 60);
  const m = total % 60;
  return h ? `${h}h ${m}m` : `${m}m`;
}

function formatShortDate(value) {
  const [year, month, day] = value.slice(0, 10).split('-').map(Number);
  return new Date(year, month - 1, day).toLocaleDateString(undefined, {
    month: 'short',
    day: 'numeric',
  });
}

// Builds a fixed-length daily series (including zero days) from the sparse
// { session_date, pages, minutes } rows the backend returns, for the bar chart.
function buildDailySeries(daily, days) {
  const map = new Map((daily || []).map((d) => [d.session_date.slice(0, 10), d]));
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const series = [];
  for (let i = days - 1; i >= 0; i--) {
    const d = new Date(today.getTime() - i * 24 * 60 * 60 * 1000);
    const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
    const entry = map.get(key);
    series.push({ date: key, pages: entry?.pages || 0, minutes: entry?.minutes || 0 });
  }
  return series;
}

function toDateKey(value) {
  const d = new Date(value);
  return `${d.getFullYear()}-${d.getMonth()}-${d.getDate()}`;
}

// Streak = consecutive days with at least one recorded action: a book added,
// finished, re-read, or a reading session logged.
function computeStreak(books, sessionDates = []) {
  const activeDays = new Set();
  books.forEach((b) => {
    [b.added_at, b.first_finished_at, b.last_finished_at].forEach((d) => {
      if (d) activeDays.add(toDateKey(d));
    });
  });
  sessionDates.forEach((d) => {
    // session_date comes back as a raw 'YYYY-MM-DD' string (see db/index.js's
    // date type-parser override), so parse components locally rather than
    // routing it through new Date(string), which would parse as UTC midnight.
    const [year, month, day] = d.slice(0, 10).split('-').map(Number);
    activeDays.add(`${year}-${month - 1}-${day}`);
  });

  const oneDay = 24 * 60 * 60 * 1000;
  let cursor = new Date();
  cursor.setHours(0, 0, 0, 0);

  if (!activeDays.has(toDateKey(cursor))) {
    cursor = new Date(cursor.getTime() - oneDay);
    if (!activeDays.has(toDateKey(cursor))) return 0;
  }

  let streak = 0;
  while (activeDays.has(toDateKey(cursor))) {
    streak += 1;
    cursor = new Date(cursor.getTime() - oneDay);
  }
  return streak;
}

export default function HomePage({ user, token, onUserUpdate }) {
  const [books, setBooks] = useState([]);
  const [profile, setProfile] = useState(null);
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [skippedGoal, setSkippedGoal] = useState(false);

  useEffect(() => {
    Promise.all([listBooks(token), getProfile(token), getReadingStats(token)])
      .then(([booksRes, profileRes, statsRes]) => {
        setBooks(booksRes.books);
        setProfile(profileRes.user);
        setStats(statsRes);
      })
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false));
  }, [token]);

  async function handleSetGoal(goal) {
    const { user: updated } = await updateProfile(token, { reading_goal: goal, reading_goal_year: CURRENT_YEAR });
    setProfile(updated);
    onUserUpdate(updated);
  }

  const counts = {
    want_to_read: books.filter((b) => b.status === 'want_to_read').length,
    reading: books.filter((b) => b.status === 'reading').length,
    finished: books.filter((b) => b.status === 'finished').length,
  };

  const rereadsLogged = books.reduce((sum, b) => sum + Math.max(b.times_read - 1, 0), 0);

  const currentlyReading = books.filter((b) => b.status === 'reading');

  const recentlyFinished = books
    .filter((b) => b.status === 'finished' && b.last_finished_at)
    .sort((a, b) => new Date(b.last_finished_at) - new Date(a.last_finished_at))
    .slice(0, 4);

  const readThisYear = books
    .filter((b) => b.status === 'finished')
    .filter((b) => {
      const effective = b.last_finished_at || b.first_finished_at;
      return effective && new Date(effective).getFullYear() === CURRENT_YEAR;
    })
    .sort((a, b) => new Date(a.first_finished_at || a.last_finished_at) - new Date(b.first_finished_at || b.last_finished_at));

  const genreCounts = readThisYear.reduce((map, b) => {
    const key = b.genre || '';
    map.set(key, (map.get(key) || 0) + 1);
    return map;
  }, new Map());

  const genreLegend = [...genreCounts.entries()]
    .map(([value, count]) => ({ ...genreInfo(value), count }))
    .sort((a, b) => b.count - a.count);

  const needsGoal = !loading && profile && !skippedGoal && (!profile.reading_goal || profile.reading_goal_year !== CURRENT_YEAR);

  const now = new Date();
  const finishedThisMonth = books.filter((b) => {
    const effective = b.last_finished_at || b.first_finished_at;
    if (!effective) return false;
    const d = new Date(effective);
    return d.getFullYear() === now.getFullYear() && d.getMonth() === now.getMonth();
  }).length;
  const streak = computeStreak(books, stats?.activeDays || []);
  const dailySeries = stats ? buildDailySeries(stats.daily, CHART_DAYS) : [];
  const maxPages = Math.max(1, ...dailySeries.map((d) => d.pages));

  return (
    <div className="home">
      {needsGoal && (
        <GoalSetupModal
          year={CURRENT_YEAR}
          onSet={handleSetGoal}
          onSkip={() => setSkippedGoal(true)}
        />
      )}

      <h1 className="home-greeting">Welcome back, {user.name || 'Reader'}</h1>
      <p className="home-sub">Here's where things stand in your nook.</p>

      {error && <p className="home-error" role="alert">{error}</p>}

      {!loading && (
        <>
          <div className="highlight-stats">
            <div className="highlight-stat">
              <div className="highlight-num">{books.length}</div>
              <div className="highlight-label">books logged</div>
            </div>
            <div className="highlight-stat">
              <div className="highlight-num">{finishedThisMonth}</div>
              <div className="highlight-label">finished this month</div>
            </div>
            <div className="highlight-stat">
              <div className="highlight-num">{streak}</div>
              <div className="highlight-label">day streak</div>
            </div>
          </div>

          {profile.reading_goal && profile.reading_goal_year === CURRENT_YEAR ? (
            <section className="goal-section">
              <GoalRing readBooks={readThisYear} goal={profile.reading_goal} />
              <div className="goal-legend">
                <h2>{CURRENT_YEAR} reading, by genre</h2>
                {genreLegend.length === 0 ? (
                  <p className="home-empty">Finish a book and tag its genre in the Library Nook to see it here.</p>
                ) : (
                  <ul>
                    {genreLegend.map((g) => (
                      <li key={g.label}>
                        <span className="legend-dot" style={{ background: g.color }} />
                        <span className="legend-label">{g.label}</span>
                        <span className="legend-count">{g.count}</span>
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            </section>
          ) : (
            <button className="goal-cta" type="button" onClick={() => setSkippedGoal(false)}>
              Set a {CURRENT_YEAR} reading goal &rarr;
            </button>
          )}

          <section className="activity-section">
            <h2>Reading activity</h2>
            {!stats || stats.sessionCount === 0 ? (
              <p className="home-empty">Log a reading session from the Library Nook to see your stats here.</p>
            ) : (
              <div className="activity-body">
                <div className="activity-summary">
                  <div className="activity-summary-stats">
                    <div className="highlight-stat">
                      <div className="highlight-num">{stats.totalPages}</div>
                      <div className="highlight-label">pages logged</div>
                    </div>
                    <div className="highlight-stat">
                      <div className="highlight-num">{formatMinutes(stats.totalMinutes)}</div>
                      <div className="highlight-label">time reading</div>
                    </div>
                    <div className="highlight-stat">
                      <div className="highlight-num">{stats.sessionCount}</div>
                      <div className="highlight-label">sessions logged</div>
                    </div>
                  </div>
                  <div className="activity-chart" role="img" aria-label={`Pages read per day, last ${CHART_DAYS} days`}>
                    {dailySeries.map((day) => (
                      <div key={day.date} className="activity-bar-col" title={`${formatShortDate(day.date)}: ${day.pages} pages`}>
                        <div
                          className="activity-bar"
                          style={{ height: day.pages > 0 ? `${Math.max((day.pages / maxPages) * 100, 6)}%` : '0%' }}
                        />
                      </div>
                    ))}
                  </div>
                </div>

                <div className="activity-recent">
                  <h3>Recent sessions</h3>
                  <ul className="activity-list">
                    {stats.recent.map((s) => (
                      <li key={s.id} className="activity-row">
                        <span className="activity-date">{formatShortDate(s.session_date)}</span>
                        <span className="activity-book">{s.title}</span>
                        <span className="activity-row-stat">
                          {[s.pages_read != null ? `${s.pages_read}p` : null, s.minutes_spent != null ? `${s.minutes_spent}m` : null]
                            .filter(Boolean)
                            .join(' · ')}
                        </span>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            )}
          </section>

          <div className="stat-cards">
            <Link to="/library?shelf=want_to_read" className="stat-card">
              <div className="stat-num">{counts.want_to_read}</div>
              <div className="stat-label">Want to Read</div>
            </Link>
            <Link to="/library?shelf=reading" className="stat-card">
              <div className="stat-num">{counts.reading}</div>
              <div className="stat-label">Currently Reading</div>
            </Link>
            <Link to="/library?shelf=finished" className="stat-card">
              <div className="stat-num">{counts.finished}</div>
              <div className="stat-label">Finished</div>
            </Link>
            <Link to="/rereads" className="stat-card">
              <div className="stat-num">{rereadsLogged}</div>
              <div className="stat-label">Re-reads logged</div>
            </Link>
          </div>

          <div className="home-columns">
            <section className="home-section">
              <div className="home-section-head">
                <h2>Currently reading</h2>
                <Link to="/library">See library &rarr;</Link>
              </div>
              {currentlyReading.length === 0 ? (
                <p className="home-empty">Nothing in progress. Pick something up in the Library Nook.</p>
              ) : (
                <ul className="home-book-list">
                  {currentlyReading.map((b) => (
                    <li key={b.id} className="home-book-row">
                      {b.cover_url ? (
                        <img src={b.cover_url} alt="" className="home-book-cover" />
                      ) : (
                        <div className="home-book-cover home-book-cover--blank" />
                      )}
                      <div>
                        <div className="home-book-title">{b.title}</div>
                        <div className="home-book-author">{b.author || 'Unknown author'}</div>
                      </div>
                    </li>
                  ))}
                </ul>
              )}
            </section>

            <section className="home-section">
              <div className="home-section-head">
                <h2>Recently finished</h2>
                <Link to="/rereads">See re-reads &rarr;</Link>
              </div>
              {recentlyFinished.length === 0 ? (
                <p className="home-empty">Nothing finished yet.</p>
              ) : (
                <ul className="home-book-list">
                  {recentlyFinished.map((b) => (
                    <li key={b.id} className="home-book-row">
                      {b.cover_url ? (
                        <img src={b.cover_url} alt="" className="home-book-cover" />
                      ) : (
                        <div className="home-book-cover home-book-cover--blank" />
                      )}
                      <div>
                        <div className="home-book-title">{b.title}</div>
                        <div className="home-book-author">
                          {b.rating ? '★'.repeat(b.rating) : SHELF_LABELS[b.status]}
                        </div>
                      </div>
                    </li>
                  ))}
                </ul>
              )}
            </section>
          </div>
        </>
      )}
    </div>
  );
}
