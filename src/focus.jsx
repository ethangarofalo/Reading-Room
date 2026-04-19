import React from 'react';
import { Icon } from './Icon.jsx';
import { DeepWorkTimer } from './timer.jsx';

export function FocusMode({ state, setState, bookId, onExit }) {
  const book = state.books.find((b) => b.id === bookId) || state.books[0];
  React.useEffect(() => {
    const onKey = (e) => { if (e.key === 'Escape') onExit(); };
    window.addEventListener('keydown', onKey);
    document.body.style.overflow = 'hidden';
    return () => { window.removeEventListener('keydown', onKey); document.body.style.overflow = ''; };
  }, []);

  if (!book) {
    return (
      <div className="focus-overlay">
        <button className="btn ghost focus-exit" onClick={onExit}>
          <Icon name="close" /> Exit focus
        </button>
        <div style={{ textAlign: 'center' }}>
          <h1 className="focus-book-title">Add what you're reading</h1>
          <div className="focus-book-author">Focus mode starts after a book is in your library.</div>
        </div>
      </div>
    );
  }

  return (
    <div className="focus-overlay">
      <button className="btn ghost focus-exit" onClick={onExit}>
        <Icon name="close" /> Exit focus
      </button>

      <div style={{ textAlign: 'center' }}>
        <h1 className="focus-book-title">{book.title}</h1>
        <div className="focus-book-author">{book.author}</div>
      </div>

      <DeepWorkTimer state={state} setState={setState} compact bookOverride={book.id} onComplete={() => {}} />

      <div className="focus-prompts">
        Notifications silenced. Put the phone down. <br />
        When the dial closes, write one sentence before moving on.
      </div>
    </div>
  );
}
