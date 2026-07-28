const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5001';

async function request(path, options = {}) {
  const res = await fetch(`${API_URL}${path}`, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...options.headers,
    },
  });

  const data = await res.json().catch(() => ({}));

  if (!res.ok) {
    throw new Error(data.error || 'Something went wrong');
  }

  return data;
}

export function signup({ email, password }) {
  return request('/auth/signup', {
    method: 'POST',
    body: JSON.stringify({ email, password }),
  });
}

export function login({ email, password }) {
  return request('/auth/login', {
    method: 'POST',
    body: JSON.stringify({ email, password }),
  });
}

function authed(token, options = {}) {
  return {
    ...options,
    headers: {
      ...options.headers,
      Authorization: `Bearer ${token}`,
    },
  };
}

export function searchBooks(token, q) {
  return request(`/books/search?q=${encodeURIComponent(q)}`, authed(token));
}

export function listBooks(token) {
  return request('/books', authed(token));
}

export function getBook(token, id) {
  return request(`/books/${id}`, authed(token));
}

export function addBook(token, book) {
  return request('/books', authed(token, {
    method: 'POST',
    body: JSON.stringify(book),
  }));
}

export function updateBook(token, id, changes) {
  return request(`/books/${id}`, authed(token, {
    method: 'PATCH',
    body: JSON.stringify(changes),
  }));
}

export function removeBook(token, id) {
  return request(`/books/${id}`, authed(token, { method: 'DELETE' }));
}

export function listReadingSessions(token, bookId) {
  return request(`/books/${bookId}/sessions`, authed(token));
}

export function addReadingSession(token, bookId, session) {
  return request(`/books/${bookId}/sessions`, authed(token, {
    method: 'POST',
    body: JSON.stringify(session),
  }));
}

export function removeReadingSession(token, bookId, sessionId) {
  return request(`/books/${bookId}/sessions/${sessionId}`, authed(token, { method: 'DELETE' }));
}

export function logReread(token, id) {
  return request(`/books/${id}/reread`, authed(token, { method: 'POST' }));
}

export function removeReread(token, id) {
  return request(`/books/${id}/reread`, authed(token, { method: 'DELETE' }));
}

export function getProfile(token) {
  return request('/auth/me', authed(token));
}

export function updateProfile(token, changes) {
  return request('/auth/me', authed(token, {
    method: 'PATCH',
    body: JSON.stringify(changes),
  }));
}

export function listNotes(token, bookId) {
  return request(`/books/${bookId}/notes`, authed(token));
}

export function addNote(token, bookId, note) {
  return request(`/books/${bookId}/notes`, authed(token, {
    method: 'POST',
    body: JSON.stringify(note),
  }));
}

export function removeNote(token, bookId, noteId) {
  return request(`/books/${bookId}/notes/${noteId}`, authed(token, { method: 'DELETE' }));
}

export function getReadingStats(token) {
  return request('/stats/reading', authed(token));
}

export function changePassword(token, currentPassword, newPassword) {
  return request('/auth/me/password', authed(token, {
    method: 'POST',
    body: JSON.stringify({ currentPassword, newPassword }),
  }));
}
