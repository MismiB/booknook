import Shelves from './Shelves';
import './LibraryPage.css';

export default function LibraryPage({ token }) {
  return (
    <div className="library-page">
      <div className="library-header">
        <h1>Library Nook</h1>
        <p>Search, shelve, and rate everything you're reading.</p>
      </div>
      <Shelves token={token} />
    </div>
  );
}
