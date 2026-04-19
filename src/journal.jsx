import React from 'react';
import { CATEGORIES, today, formatDate, formatFullDate } from './data.js';
import { Card, Chip } from './ui.jsx';
import { Icon } from './Icon.jsx';

const getSpeechRecognition = () =>
  window.SpeechRecognition || window.webkitSpeechRecognition || null;

const appendTranscript = (base, addition) => {
  const next = addition.trim();
  if (!next) return base;
  if (!base.trim()) return next;
  return `${base.trimEnd()}\n\n${next}`;
};

const emptyAnnotationDraft = {
  quote: '',
  note: '',
  location: '',
  tags: '',
};

const parseTags = (value) =>
  Array.from(new Set(
    String(value || '')
      .split(',')
      .map((tag) => tag.trim().replace(/^#/, ''))
      .filter(Boolean)
  ));

const formatTags = (tags) => (tags || []).join(', ');

export function Journal({ state, setState }) {
  const activeId = state.activeBookId || state.books[0]?.id;
  const book = state.books.find((b) => b.id === activeId);
  const todayIso = today();

  const entries = (state.entries[activeId] || []).slice().sort((a, b) => b.date.localeCompare(a.date));
  const todayEntry = entries.find((e) => e.date === todayIso);
  const annotations = ((state.annotations || {})[activeId] || [])
    .slice()
    .sort((a, b) => (b.createdAt || b.date || '').localeCompare(a.createdAt || a.date || ''));

  const [text, setText] = React.useState(todayEntry?.text || '');
  const [pages, setPages] = React.useState(book?.pagesToday || 0);
  const [annotationDraft, setAnnotationDraft] = React.useState(emptyAnnotationDraft);
  const [editingAnnotationId, setEditingAnnotationId] = React.useState(null);
  const [savedFlash, setSavedFlash] = React.useState(false);
  const [listening, setListening] = React.useState(false);
  const [interimTranscript, setInterimTranscript] = React.useState('');
  const [speechError, setSpeechError] = React.useState('');
  const recognitionRef = React.useRef(null);
  const speechSupported = typeof window !== 'undefined' && !!getSpeechRecognition();

  React.useEffect(() => {
    setText(todayEntry?.text || '');
    setPages(book?.pagesToday || 0);
    setAnnotationDraft(emptyAnnotationDraft);
    setEditingAnnotationId(null);
    setInterimTranscript('');
    setSpeechError('');
    recognitionRef.current?.abort();
    recognitionRef.current = null;
    setListening(false);
  }, [activeId]);

  React.useEffect(() => () => {
    recognitionRef.current?.abort();
  }, []);

  const saveTimer = React.useRef();
  React.useEffect(() => {
    if (!book) return;
    clearTimeout(saveTimer.current);
    saveTimer.current = setTimeout(() => {
      setState((s) => {
        const list = (s.entries[activeId] || []).filter((e) => e.date !== todayIso);
        const newEntry = { date: todayIso, pages: pages || 0, text };
        const next = text.trim() || pages > 0 ? [newEntry, ...list] : list;
        const books = s.books.map((b) =>
          b.id === activeId
            ? { ...b, pagesToday: pages || 0, pagesRead: Math.max(b.pagesRead, (todayEntry ? b.pagesRead - (todayEntry.pages || 0) : b.pagesRead) + (pages || 0)) }
            : b
        );
        return { ...s, entries: { ...s.entries, [activeId]: next }, books };
      });
      setSavedFlash(true);
      setTimeout(() => setSavedFlash(false), 1200);
    }, 500);
    return () => clearTimeout(saveTimer.current);
  }, [text, pages]);

  const startVoiceNote = () => {
    const SpeechRecognition = getSpeechRecognition();
    if (!SpeechRecognition) {
      setSpeechError('Speech recognition is not supported in this browser.');
      return;
    }

    recognitionRef.current?.abort();
    const recognition = new SpeechRecognition();
    recognition.continuous = true;
    recognition.interimResults = true;
    recognition.lang = navigator.language || 'en-US';

    recognition.onstart = () => {
      setSpeechError('');
      setInterimTranscript('');
      setListening(true);
    };

    recognition.onresult = (event) => {
      let finalText = '';
      let interimText = '';

      for (let i = event.resultIndex; i < event.results.length; i += 1) {
        const transcript = event.results[i][0]?.transcript || '';
        if (event.results[i].isFinal) finalText += transcript;
        else interimText += transcript;
      }

      if (finalText.trim()) setText((current) => appendTranscript(current, finalText));
      setInterimTranscript(interimText.trim());
    };

    recognition.onerror = (event) => {
      const message = event.error === 'not-allowed'
        ? 'Microphone access was blocked.'
        : 'Speech recognition stopped unexpectedly.';
      setSpeechError(message);
      setListening(false);
    };

    recognition.onend = () => {
      setListening(false);
      setInterimTranscript('');
      recognitionRef.current = null;
    };

    recognitionRef.current = recognition;
    try {
      recognition.start();
    } catch {
      setSpeechError('Could not start microphone dictation.');
      setListening(false);
      recognitionRef.current = null;
    }
  };

  const stopVoiceNote = () => {
    recognitionRef.current?.stop();
    setListening(false);
  };

  const toggleVoiceNote = () => {
    if (listening) stopVoiceNote();
    else startVoiceNote();
  };

  const saveAnnotation = () => {
    if (!book) return;
    const quote = annotationDraft.quote.trim();
    const note = annotationDraft.note.trim();
    const location = annotationDraft.location.trim();
    const tags = parseTags(annotationDraft.tags);

    if (!quote && !note) return;

    const now = new Date().toISOString();
    setState((s) => {
      const current = ((s.annotations || {})[activeId] || []).slice();
      const existing = current.find((a) => a.id === editingAnnotationId);
      const nextAnnotation = {
        id: editingAnnotationId || `ann-${Math.random().toString(36).slice(2, 10)}`,
        date: existing?.date || todayIso,
        createdAt: existing?.createdAt || now,
        updatedAt: now,
        quote,
        note,
        location,
        tags,
        source: existing?.source || 'manual',
      };

      const nextList = editingAnnotationId
        ? current.map((a) => (a.id === editingAnnotationId ? nextAnnotation : a))
        : [nextAnnotation, ...current];

      return {
        ...s,
        annotations: {
          ...(s.annotations || {}),
          [activeId]: nextList,
        },
      };
    });

    setAnnotationDraft(emptyAnnotationDraft);
    setEditingAnnotationId(null);
    setSavedFlash(true);
    setTimeout(() => setSavedFlash(false), 1200);
  };

  const editAnnotation = (annotation) => {
    setEditingAnnotationId(annotation.id);
    setAnnotationDraft({
      quote: annotation.quote || '',
      note: annotation.note || '',
      location: annotation.location || '',
      tags: formatTags(annotation.tags),
    });
  };

  const deleteAnnotation = (id) => {
    setState((s) => ({
      ...s,
      annotations: {
        ...(s.annotations || {}),
        [activeId]: ((s.annotations || {})[activeId] || []).filter((a) => a.id !== id),
      },
    }));
    if (editingAnnotationId === id) {
      setEditingAnnotationId(null);
      setAnnotationDraft(emptyAnnotationDraft);
    }
  };

  const cancelAnnotationEdit = () => {
    setEditingAnnotationId(null);
    setAnnotationDraft(emptyAnnotationDraft);
  };

  if (!book) {
    return (
      <Card title="Today's notes" right={<span className="card-sub mono">{formatFullDate()}</span>}>
        <div className="empty muted">Add what you're reading, then write or dictate notes here by book and day.</div>
      </Card>
    );
  }

  const wordCount = text.trim() ? text.trim().split(/\s+/).length : 0;

  return (
    <Card
      title="Today's notes"
      right={<span className="card-sub mono">{formatFullDate()}</span>}
    >
      <div className="journal-head">
        <div className="journal-tabs" role="tablist">
          {state.books.map((b) => (
            <button
              key={b.id}
              role="tab"
              aria-selected={b.id === activeId}
              className="journal-tab"
              onClick={() => setState((s) => ({ ...s, activeBookId: b.id }))}
            >
              <span className="dot" style={{ background: CATEGORIES[b.category].tone }} />
              <span style={{ fontStyle: 'italic' }}>{b.title}</span>
            </button>
          ))}
        </div>
      </div>

      <div className="journal-book-head">
        <h3 className="journal-book-title">
          {book.title}
          <em>{book.author}</em>
        </h3>
        <div className="journal-tools">
          <Chip category={book.category} />
          <button
            className={`btn small ${listening ? 'primary' : ''}`}
            onClick={toggleVoiceNote}
            disabled={!speechSupported}
            title={speechSupported ? 'Dictate a voice note' : 'Speech recognition is not supported in this browser'}
          >
            <Icon name="mic" className="ic-sm" />
            {listening ? 'Stop' : 'Voice note'}
          </button>
        </div>
      </div>

      <textarea
        className="journal-textarea"
        placeholder={`Takeaways, quotes, questions from today's reading of ${book.title}…`}
        value={text}
        onChange={(e) => setText(e.target.value)}
      />

      {(listening || interimTranscript || speechError) && (
        <div className={`voice-status ${listening ? 'recording' : ''}`}>
          {speechError || (interimTranscript ? `Listening: ${interimTranscript}` : 'Listening...')}
        </div>
      )}

      <div className="journal-foot">
        <div className="journal-pages">
          <label htmlFor="pp">pages today</label>
          <input
            id="pp"
            type="number"
            min="0"
            value={pages}
            onChange={(e) => setPages(Math.max(0, +e.target.value || 0))}
          />
        </div>
        <div className="row" style={{ gap: 12 }}>
          <span>{wordCount} words</span>
          <span className={`journal-saved ${savedFlash ? 'show' : ''}`}>✓ saved</span>
        </div>
      </div>

      <div className="annotation-panel">
        <div className="annotation-head">
          <div>
            <div className="card-title">Marginalia</div>
            <div className="annotation-sub">Save the passage and your thought as one object.</div>
          </div>
          <span className="card-sub mono">{annotations.length} saved</span>
        </div>

        <div className="annotation-form">
          <textarea
            className="annotation-field annotation-quote-input"
            placeholder="Quote / passage"
            value={annotationDraft.quote}
            onChange={(e) => setAnnotationDraft((draft) => ({ ...draft, quote: e.target.value }))}
          />
          <textarea
            className="annotation-field annotation-note-input"
            placeholder="My thought"
            value={annotationDraft.note}
            onChange={(e) => setAnnotationDraft((draft) => ({ ...draft, note: e.target.value }))}
          />
          <div className="annotation-meta-row">
            <input
              className="annotation-input"
              placeholder="Page, chapter, section"
              value={annotationDraft.location}
              onChange={(e) => setAnnotationDraft((draft) => ({ ...draft, location: e.target.value }))}
            />
            <input
              className="annotation-input"
              placeholder="tags: justice, image, question"
              value={annotationDraft.tags}
              onChange={(e) => setAnnotationDraft((draft) => ({ ...draft, tags: e.target.value }))}
            />
            <button
              className="btn primary"
              onClick={saveAnnotation}
              disabled={!annotationDraft.quote.trim() && !annotationDraft.note.trim()}
            >
              {editingAnnotationId ? 'Update' : 'Save'}
            </button>
            {editingAnnotationId && (
              <button className="btn ghost" onClick={cancelAnnotationEdit}>Cancel</button>
            )}
          </div>
        </div>

        <div className="annotation-list">
          {annotations.length === 0 ? (
            <div className="empty muted">No marginalia yet. Add a quote, a thought, or both.</div>
          ) : annotations.slice(0, 8).map((annotation) => (
            <article key={annotation.id} className="annotation-card">
              <div className="annotation-card-head">
                <div className="annotation-date mono">
                  <span>{formatDate(annotation.date)}</span>
                  {annotation.location && <span>{annotation.location}</span>}
                </div>
                <div className="row" style={{ gap: 4 }}>
                  <button className="btn small ghost" onClick={() => editAnnotation(annotation)}>Edit</button>
                  <button className="btn small ghost" onClick={() => deleteAnnotation(annotation.id)}>Delete</button>
                </div>
              </div>
              {annotation.quote && (
                <blockquote className="annotation-quote">{annotation.quote}</blockquote>
              )}
              {annotation.note && (
                <div className="annotation-note serif">{annotation.note}</div>
              )}
              {annotation.tags?.length > 0 && (
                <div className="annotation-tags">
                  {annotation.tags.map((tag) => <span key={tag}>#{tag}</span>)}
                </div>
              )}
            </article>
          ))}
        </div>
      </div>

      {entries.filter((e) => e.date !== todayIso).length > 0 && (
        <div className="recent-entries">
          <div className="card-title" style={{ marginBottom: 8 }}>Recent entries</div>
          {entries.filter((e) => e.date !== todayIso).slice(0, 3).map((e) => (
            <div key={e.date} className="recent-entry">
              <div className="recent-entry-head">
                <span>{formatDate(e.date)}</span>
                <span>{e.pages} pp</span>
              </div>
              <div className="recent-entry-body">{e.text}</div>
            </div>
          ))}
        </div>
      )}
    </Card>
  );
}
