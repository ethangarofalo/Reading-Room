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

const MARK_KINDS = ['underline', 'circle', 'bracket'];

const COLOR_OPTIONS = [
  { id: null,         label: 'None',       tone: 'transparent' },
  { id: 'question',   label: 'Question',   tone: 'oklch(70% 0.15 240)' },
  { id: 'claim',      label: 'Key claim',  tone: 'oklch(60% 0.18 25)'  },
  { id: 'definition', label: 'Definition', tone: 'oklch(60% 0.15 150)' },
  { id: 'image',      label: 'Image',      tone: 'oklch(70% 0.14 80)'  },
  { id: 'tension',    label: 'Tension',    tone: 'oklch(55% 0.18 320)' },
];

const emptyAnnotationDraft = {
  quote: '',
  note: '',
  location: '',
  tags: '',
  marks: [],
  links: [],
  color: null,
};

const splitWords = (text) => String(text || '').split(/(\s+)/).filter((s) => s.length > 0);

const isWord = (token) => /\S/.test(token);

const wordIndices = (tokens) => {
  const idx = [];
  let w = 0;
  tokens.forEach((tok, i) => {
    if (isWord(tok)) { idx[i] = w; w += 1; } else { idx[i] = null; }
  });
  return idx;
};

const hasMark = (marks, word, kind) => marks.some((m) => m.word === word && m.kind === kind);

const toggleMark = (marks, word, kind) => {
  if (hasMark(marks, word, kind)) return marks.filter((m) => !(m.word === word && m.kind === kind));
  return [...marks, { word, kind }];
};

const adjacentSameKind = (marks, word, kind) =>
  marks.some((m) => m.kind === kind && (m.word === word - 1 || m.word === word + 1));

function MarkedQuote({ quote, marks, interactive, activeMark, onToggleMark }) {
  if (!quote) return null;
  const tokens = splitWords(quote);
  const idx = wordIndices(tokens);
  const safeMarks = marks || [];
  return (
    <div className={`marked-quote ${interactive ? 'interactive' : ''}`}>
      {tokens.map((tok, i) => {
        if (!isWord(tok)) return <span key={i}>{tok}</span>;
        const w = idx[i];
        const u = hasMark(safeMarks, w, 'underline');
        const c = hasMark(safeMarks, w, 'circle');
        const b = hasMark(safeMarks, w, 'bracket');
        const cls = [
          'mq-word',
          u && 'mq-underline',
          c && 'mq-circle',
          b && 'mq-bracket',
          u && adjacentSameKind(safeMarks, w, 'underline') && 'mq-underline-join',
          b && adjacentSameKind(safeMarks, w, 'bracket') && 'mq-bracket-join',
        ].filter(Boolean).join(' ');
        return (
          <span
            key={i}
            className={cls}
            onClick={interactive ? () => onToggleMark(w, activeMark) : undefined}
            role={interactive ? 'button' : undefined}
            tabIndex={interactive ? 0 : undefined}
          >
            {tok}
          </span>
        );
      })}
    </div>
  );
}

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
  const [activeMark, setActiveMark] = React.useState('underline');
  const [linkPickerOpen, setLinkPickerOpen] = React.useState(false);
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
      const validMarks = (annotationDraft.marks || []).filter((m) => MARK_KINDS.includes(m.kind));
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
        marks: validMarks,
        links: annotationDraft.links || [],
        color: annotationDraft.color || null,
        anchor: existing?.anchor || { prefix: '', suffix: '' },
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
    setLinkPickerOpen(false);
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
      marks: annotation.marks || [],
      links: annotation.links || [],
      color: annotation.color || null,
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

          {annotationDraft.quote.trim() && (
            <div className="mark-editor">
              <div className="mark-toolbar">
                <span className="mark-label muted">Mark words:</span>
                {MARK_KINDS.map((kind) => (
                  <button
                    key={kind}
                    className={`btn small ${activeMark === kind ? 'primary' : 'ghost'}`}
                    onClick={() => setActiveMark(kind)}
                    type="button"
                  >
                    {kind}
                  </button>
                ))}
                {annotationDraft.marks.length > 0 && (
                  <button
                    className="btn small ghost"
                    onClick={() => setAnnotationDraft((d) => ({ ...d, marks: [] }))}
                    type="button"
                  >
                    Clear marks
                  </button>
                )}
              </div>
              <MarkedQuote
                quote={annotationDraft.quote}
                marks={annotationDraft.marks}
                interactive
                activeMark={activeMark}
                onToggleMark={(word, kind) =>
                  setAnnotationDraft((d) => ({ ...d, marks: toggleMark(d.marks || [], word, kind) }))
                }
              />
            </div>
          )}

          <textarea
            className="annotation-field annotation-note-input"
            placeholder="My thought"
            value={annotationDraft.note}
            onChange={(e) => setAnnotationDraft((draft) => ({ ...draft, note: e.target.value }))}
          />

          <div className="annotation-color-row">
            <span className="muted" style={{ fontSize: 12 }}>Color:</span>
            {COLOR_OPTIONS.map((c) => (
              <button
                key={c.id || 'none'}
                type="button"
                className={`color-swatch ${annotationDraft.color === c.id ? 'active' : ''}`}
                style={{ background: c.tone, borderStyle: c.id ? 'solid' : 'dashed' }}
                title={c.label}
                onClick={() => setAnnotationDraft((d) => ({ ...d, color: c.id }))}
              />
            ))}
          </div>

          <div className="annotation-link-row">
            <button className="btn small ghost" type="button" onClick={() => setLinkPickerOpen((o) => !o)}>
              {linkPickerOpen ? 'Close links' : `Link to marginal (${annotationDraft.links.length})`}
            </button>
            {annotationDraft.links.length > 0 && (
              <div className="annotation-link-chips">
                {annotationDraft.links.map((linkId) => {
                  const target = annotations.find((a) => a.id === linkId);
                  if (!target) return null;
                  const preview = (target.quote || target.note || '').slice(0, 32);
                  return (
                    <span key={linkId} className="link-chip">
                      {preview}…
                      <button
                        type="button"
                        onClick={() => setAnnotationDraft((d) => ({ ...d, links: d.links.filter((id) => id !== linkId) }))}
                      >×</button>
                    </span>
                  );
                })}
              </div>
            )}
          </div>

          {linkPickerOpen && (
            <div className="link-picker">
              {annotations.filter((a) => a.id !== editingAnnotationId).slice(0, 12).length === 0 ? (
                <div className="muted" style={{ fontSize: 12 }}>No other marginalia on this book yet.</div>
              ) : (
                annotations
                  .filter((a) => a.id !== editingAnnotationId)
                  .slice(0, 12)
                  .map((a) => {
                    const linked = annotationDraft.links.includes(a.id);
                    const preview = (a.quote || a.note || '').slice(0, 64);
                    return (
                      <button
                        key={a.id}
                        type="button"
                        className={`link-option ${linked ? 'active' : ''}`}
                        onClick={() =>
                          setAnnotationDraft((d) => ({
                            ...d,
                            links: linked ? d.links.filter((id) => id !== a.id) : [...d.links, a.id],
                          }))
                        }
                      >
                        <span className="muted mono" style={{ fontSize: 11 }}>{formatDate(a.date)}</span>
                        <span>{preview}…</span>
                      </button>
                    );
                  })
              )}
            </div>
          )}

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
          ) : annotations.slice(0, 8).map((annotation) => {
            const colorTone = COLOR_OPTIONS.find((c) => c.id === annotation.color)?.tone;
            const linkedTargets = (annotation.links || [])
              .map((id) => annotations.find((a) => a.id === id))
              .filter(Boolean);
            return (
              <article
                key={annotation.id}
                id={`ann-${annotation.id}`}
                className="annotation-card"
                style={colorTone && colorTone !== 'transparent' ? { borderLeft: `3px solid ${colorTone}` } : undefined}
              >
                <div className="annotation-card-head">
                  <div className="annotation-date mono">
                    <span>{formatDate(annotation.date)}</span>
                    {annotation.location && <span>{annotation.location}</span>}
                    {annotation.color && (
                      <span className="muted" style={{ textTransform: 'capitalize' }}>
                        {COLOR_OPTIONS.find((c) => c.id === annotation.color)?.label}
                      </span>
                    )}
                  </div>
                  <div className="row" style={{ gap: 4 }}>
                    <button className="btn small ghost" onClick={() => editAnnotation(annotation)}>Edit</button>
                    <button className="btn small ghost" onClick={() => deleteAnnotation(annotation.id)}>Delete</button>
                  </div>
                </div>
                {annotation.quote && (
                  <blockquote className="annotation-quote">
                    {(annotation.marks?.length > 0)
                      ? <MarkedQuote quote={annotation.quote} marks={annotation.marks} />
                      : annotation.quote}
                  </blockquote>
                )}
                {annotation.note && (
                  <div className="annotation-note serif">{annotation.note}</div>
                )}
                {linkedTargets.length > 0 && (
                  <div className="annotation-link-chips">
                    {linkedTargets.map((t) => {
                      const preview = (t.quote || t.note || '').slice(0, 32);
                      return (
                        <a
                          key={t.id}
                          className="link-chip"
                          href={`#ann-${t.id}`}
                          onClick={(e) => {
                            e.preventDefault();
                            const el = document.getElementById(`ann-${t.id}`);
                            if (el) {
                              el.scrollIntoView({ behavior: 'smooth', block: 'center' });
                              el.classList.add('flash');
                              setTimeout(() => el.classList.remove('flash'), 1200);
                            }
                          }}
                        >
                          → {preview}…
                        </a>
                      );
                    })}
                  </div>
                )}
                {annotation.tags?.length > 0 && (
                  <div className="annotation-tags">
                    {annotation.tags.map((tag) => <span key={tag}>#{tag}</span>)}
                  </div>
                )}
              </article>
            );
          })}
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
