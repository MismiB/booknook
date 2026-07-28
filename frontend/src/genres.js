export const GENRES = [
  { value: '', label: 'Unspecified', color: '#8a8a8a' },
  { value: 'fiction', label: 'Fiction', color: '#e07a5f' },
  { value: 'non-fiction', label: 'Non-fiction', color: '#81b29a' },
  { value: 'fantasy', label: 'Fantasy', color: '#9b7fd4' },
  { value: 'sci-fi', label: 'Sci-Fi', color: '#4f9dde' },
  { value: 'romance', label: 'Romance', color: '#e8829a' },
  { value: 'mystery-thriller', label: 'Mystery / Thriller', color: '#d4a24c' },
  { value: 'horror', label: 'Horror', color: '#8c3f3f' },
  { value: 'biography', label: 'Biography', color: '#6b8f9c' },
  { value: 'self-help', label: 'Self-help', color: '#c9a84c' },
  { value: 'history', label: 'History', color: '#a1785a' },
  { value: 'young-adult', label: 'Young Adult', color: '#d98ecb' },
  { value: 'poetry', label: 'Poetry', color: '#7ac3c9' },
];

const GENRE_MAP = Object.fromEntries(GENRES.map((g) => [g.value, g]));

export function genreInfo(value) {
  return GENRE_MAP[value || ''] || GENRE_MAP[''];
}
