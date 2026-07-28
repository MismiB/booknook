# BookNook

A personal reading tracker. As an avid reader, I wanted to create a Goodreads-alternative for keeping shelves, ratings, reviews, reading sessions, and quotes/notes all in one place.

**Live:**
- App: https://booknook-frontend-zii1.onrender.com
- API: https://booknook-kt4z.onrender.com

> Hosted on Render's free tier — the backend spins down after 15 minutes idle, so the first request after a quiet period can take 30–60 seconds to wake up.

## Features

- **Library shelves** — Want to Read / Currently Reading / Finished, with search via the Open Library API or manual entry (title, author, ISBN, publisher, cover URL) for books search can't find.
- **Book detail page** — genre, status, star rating and free-text review (once finished), a reading log (pages/minutes/date per sitting, with history), and notes & quotes (optional tag and page number).
- **Re-reads tracking** — logs how many times the user has finished a book, with editable first-finished and last-finished dates.
- **Home dashboard** — yearly reading goal ring with a genre breakdown, a reading-activity summary (total pages/time/sessions, a 14-day bar chart, recent sessions feed), and a day streak.
- **Profile** — name, date of birth, gender, country, yearly reading goal, password change, and a visual theme (7 palettes) that syncs to the user's account and follows the user across devices.
- **Auth** — email/password signup and login, JWT-based sessions.

## Tech stack

- **Frontend**: React 19 + Vite, React Router, plain CSS (no UI framework)
- **Backend**: Node.js + Express 5
- **Database**: PostgreSQL (hosted on Supabase)
- **Auth**: JSON Web Tokens (`jsonwebtoken`), passwords hashed with `bcrypt`

## Project structure

```
booknook/
├── backend/
│   ├── index.js           # Express app entry point, route mounting
│   ├── auth.js             # signup / login / profile routes
│   ├── books.js            # shelves, reading sessions, notes routes
│   ├── stats.js             # reading-activity aggregate stats route
│   ├── db/index.js          # pg Pool setup
│   └── middleware/auth.js   # JWT verification middleware
├── frontend/
│   └── src/
│       ├── api.js            # fetch wrapper for all backend calls
│       ├── App.jsx            # routes + session/theme state
│       ├── components/        # shared UI (DateFields, ThemeBar, GoalRing, ...)
│       └── pages/              # Home, Library (Shelves), BookDetail, Re-reads, Profile
└── render.yaml               # Render Blueprint (reference; services are set up manually in the dashboard)
```

## Running it locally

**Prerequisites**: Node.js 20+, a Postgres database (this project uses [Supabase](https://supabase.com)'s free tier).

### 1. Backend

```bash
cd backend
npm install
```

Create `backend/.env`:

```
DATABASE_URL=postgres://...        # the user's Postgres connection string
JWT_SECRET=some-long-random-string
PORT=5001                          # optional, defaults to 5000
```

Then:

```bash
npm run dev     # runs on nodemon, auto-restarts on file changes
# or: npm start # plain node, no auto-restart
```

### 2. Frontend

```bash
cd frontend
npm install
```

Create `frontend/.env.local`:

```
VITE_API_URL=http://localhost:5001
```

Then:

```bash
npm run dev
```

The app will be at `http://localhost:5173`.

## Environment variables

| Variable | Where | Purpose |
|---|---|---|
| `DATABASE_URL` | backend | Postgres connection string. Use Supabase's **pooled** connection string (port `6543`), not the direct one — the direct connection resolves to an IPv6-only address that most hosts (including Render) can't route to. |
| `JWT_SECRET` | backend | Signing secret for login tokens. Any long random string; must stay the same across restarts or existing sessions become invalid. |
| `FRONTEND_URL` | backend | *(optional)* Locks CORS down to this exact origin. If unset, the API accepts requests from any origin — fine for local dev, worth setting in production. |
| `PORT` | backend | *(optional)* Defaults to `5000` locally; Render sets this automatically in production. |
| `VITE_API_URL` | frontend | The backend's URL. Baked in at build time, so it must be set *before* building. |

## Deployment

Deployed as two separate Render services from this repo:

1. **`booknook-api`** — Web Service, root directory `backend`, build `npm install`, start `npm start`. Env vars: `DATABASE_URL`, `JWT_SECRET`, `FRONTEND_URL`.
2. **`booknook-web`** — Static Site, root directory `frontend`, build `npm install && npm run build`, publish directory `dist`. Env var: `VITE_API_URL`. Needs a rewrite rule (`/*` → `/index.html`) so client-side routes (e.g. `/books/5`) don't 404 on refresh.

A `render.yaml` Blueprint is included as a reference for this setup, though the live services were configured directly in the Render dashboard.

## Database schema (high level)

- **`users`** — auth + profile fields (name, date of birth, gender, country, reading goal, theme).
- **`books`** — one row per shelved book: title/author/ISBN/publisher/cover, status, rating, review, genre, timestamps, times re-read.
- **`reading_sessions`** — pages/minutes logged per book per day.
- **`notes`** — quotes/notes per book, with optional tag and page number.

## Known gaps / possible next steps

- No social/community features (following, shared recommendations).
- No e-reader sync (Kindle/Kobo highlights import, etc.).
- No automated test suite — verification during development has been manual/exploratory (Playwright-driven smoke tests, not a checked-in test suite).
