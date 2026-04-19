import React from 'react';
import { today, formatDate } from './data.js';
import { Icon } from './Icon.jsx';
import { Card, Chip, ProgressBar } from './ui.jsx';
import { parseBookIntake } from './bookParser.js';

const DAY_LABELS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

function fmtTimeRange(s, e) {
  const fmt = (t) => {
    if (!t) return '';
    const [h, m] = t.split(':').map(Number);
    const ap = h >= 12 ? 'pm' : 'am';
    const hh = ((h + 11) % 12) + 1;
    return `${hh}${m ? ':' + String(m).padStart(2, '0') : ''}${ap}`;
  };
  if (!s && !e) return '';
  if (s && e) return `${fmt(s)}–${fmt(e)}`;
  return fmt(s || e);
}

export function EditableText({ value, onChange, className, placeholder, multiline }) {
  const [editing, setEditing] = React.useState(false);
  const [draft, setDraft] = React.useState(value);
  React.useEffect(() => setDraft(value), [value]);

  const commit = () => {
    setEditing(false);
    const v = (draft || '').trim();
    if (v !== value) onChange(v);
    else setDraft(value);
  };

  if (editing) {
    const Tag = multiline ? 'textarea' : 'input';
    return (
      <Tag
        className={`inline-edit ${className || ''}`}
        value={draft}
        autoFocus
        placeholder={placeholder}
        onChange={(e) => setDraft(e.target.value)}
        onBlur={commit}
        onKeyDown={(e) => {
          if (e.key === 'Enter' && !multiline) { e.preventDefault(); e.target.blur(); }
          if (e.key === 'Escape') { setDraft(value); setEditing(false); }
        }}
        onClick={(e) => e.stopPropagation()}
      />
    );
  }
  return (
    <span
      className={`editable ${className || ''}`}
      onClick={(e) => { e.stopPropagation(); setEditing(true); }}
      title="Click to edit"
    >
      {value || <span className="muted">{placeholder}</span>}
    </span>
  );
}

export function RowMenu({ items, align = 'right' }) {
  const [open, setOpen] = React.useState(false);
  const ref = React.useRef();
  React.useEffect(() => {
    if (!open) return;
    const onDoc = (e) => { if (ref.current && !ref.current.contains(e.target)) setOpen(false); };
    document.addEventListener('mousedown', onDoc);
    return () => document.removeEventListener('mousedown', onDoc);
  }, [open]);
  return (
    <div className="row-menu" ref={ref}>
      <button className="btn icon ghost" aria-label="More" onClick={(e) => { e.stopPropagation(); setOpen((o) => !o); }}>
        <svg className="ic" viewBox="0 0 24 24"><circle cx="5" cy="12" r="1.6" fill="currentColor"/><circle cx="12" cy="12" r="1.6" fill="currentColor"/><circle cx="19" cy="12" r="1.6" fill="currentColor"/></svg>
      </button>
      {open && (
        <div className={`row-menu-pop ${align}`} onClick={(e) => e.stopPropagation()}>
          {items.map((it, i) => (
            <button key={i} className={`row-menu-item ${it.danger ? 'danger' : ''}`} onClick={() => { setOpen(false); it.onClick(); }}>
              {it.label}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

export function ContextChip({ ctx, onChange, contexts, onManage }) {
  const [open, setOpen] = React.useState(false);
  const ref = React.useRef();
  React.useEffect(() => {
    if (!open) return;
    const onDoc = (e) => { if (ref.current && !ref.current.contains(e.target)) setOpen(false); };
    document.addEventListener('mousedown', onDoc);
    return () => document.removeEventListener('mousedown', onDoc);
  }, [open]);
  return (
    <span className="ctx-chip-wrap" ref={ref}>
      <button
        className="ctx-chip"
        onClick={(e) => { e.stopPropagation(); setOpen((o) => !o); }}
        style={ctx ? { '--ctx': ctx.color } : {}}
      >
        {ctx ? (
          <>
            <span className="ctx-dot" />
            <span className="ctx-name">{ctx.name}</span>
          </>
        ) : (
          <span className="muted" style={{ fontSize: 11 }}>+ context</span>
        )}
      </button>
      {open && (
        <div className="ctx-pop" onClick={(e) => e.stopPropagation()}>
          <button className="ctx-pop-item" onClick={() => { onChange(null); setOpen(false); }}>
            <span className="ctx-dot" style={{ background: 'var(--line-2)' }} />
            None
          </button>
          {contexts.map((c) => (
            <button key={c.id} className="ctx-pop-item" onClick={() => { onChange(c.id); setOpen(false); }}>
              <span className="ctx-dot" style={{ background: c.color }} />
              {c.name}
            </button>
          ))}
          {onManage && (
            <>
              <div className="ctx-pop-divider" />
              <button className="ctx-pop-item muted" onClick={() => { setOpen(false); onManage(); }}>
                Manage contexts…
              </button>
            </>
          )}
        </div>
      )}
    </span>
  );
}

export function TodayPlan({ state, setState, onManageContexts }) {
  const togglePlan = (id) => setState((s) => ({ ...s, plan: s.plan.map((p) => p.id === id ? { ...p, done: !p.done } : p) }));
  const updatePlan = (id, patch) => setState((s) => ({ ...s, plan: s.plan.map((p) => p.id === id ? { ...p, ...patch } : p) }));
  const removePlan = (id) => setState((s) => ({ ...s, plan: s.plan.filter((p) => p.id !== id) }));
  const addPlan = () => setState((s) => ({
    ...s,
    plan: [...s.plan, {
      id: 'p-' + Math.random().toString(36).slice(2, 8),
      bookId: s.books[0]?.id, contextId: null, label: '', meta: '', done: false,
    }],
  }));

  const done = state.plan.filter((p) => p.done).length;
  const total = state.plan.length;
  const pct = total ? Math.round((done / total) * 100) : 0;

  const groups = {};
  const orphans = [];
  state.plan.forEach((p) => {
    const ctx = state.contexts.find((c) => c.id === p.contextId);
    if (!ctx) orphans.push(p);
    else {
      if (!groups[ctx.id]) groups[ctx.id] = { ctx, items: [] };
      groups[ctx.id].items.push(p);
    }
  });
  const groupList = state.contexts.filter((c) => groups[c.id]).map((c) => groups[c.id]);
  if (orphans.length) groupList.push({ ctx: null, items: orphans });

  return (
    <Card
      title="Today's reading plan"
      right={
        <div className="row" style={{ gap: 10 }}>
          <span className="card-sub mono">{done} of {total}</span>
          <button className="btn small" onClick={addPlan}>
            <Icon name="plus" className="ic-sm" /> Task
          </button>
        </div>
      }
    >
      <div className="plan-progress-wrap">
        <div className="plan-progress-bar"><span style={{ width: `${pct}%` }} /></div>
        <span className="mono muted" style={{ fontSize: 11 }}>{pct}%</span>
      </div>

      <div className="plan-groups">
        {groupList.map((g) => (
          <div key={g.ctx?.id || 'orphan'} className="plan-group">
            <div className="plan-group-head" style={g.ctx ? { '--ctx': g.ctx.color } : {}}>
              <span className="plan-group-dot" />
              <span className="plan-group-name">
                {g.ctx ? g.ctx.name : <span className="muted">Unassigned</span>}
              </span>
              {g.ctx?.schedule?.day != null && (
                <span className="plan-group-schedule mono">
                  {DAY_LABELS[g.ctx.schedule.day]}
                  {(g.ctx.schedule.start || g.ctx.schedule.end) && ' · '}
                  {fmtTimeRange(g.ctx.schedule.start, g.ctx.schedule.end)}
                </span>
              )}
            </div>
            <div className="plan-list">
              {g.items.map((p) => {
                const book = state.books.find((b) => b.id === p.bookId);
                return (
                  <div key={p.id} className={`plan-row ${p.done ? 'done' : ''}`}>
                    <button
                      className="plan-check"
                      onClick={() => togglePlan(p.id)}
                      aria-label={p.done ? 'Mark incomplete' : 'Mark complete'}
                    >
                      {p.done && <Icon name="check" className="ic-sm" />}
                    </button>
                    <div className="plan-middle">
                      <div className="plan-top-row">
                        <select
                          className="plan-book-select"
                          value={p.bookId || ''}
                          onChange={(e) => updatePlan(p.id, { bookId: e.target.value })}
                          onClick={(e) => e.stopPropagation()}
                          aria-label="Book"
                        >
                          <option value="">—</option>
                          {state.books.map((b) => (
                            <option key={b.id} value={b.id}>{b.title}</option>
                          ))}
                        </select>
                        {book && <Chip category={book.category} />}
                        <ContextChip
                          ctx={state.contexts.find((c) => c.id === p.contextId)}
                          contexts={state.contexts}
                          onChange={(cid) => updatePlan(p.id, { contextId: cid })}
                          onManage={onManageContexts}
                        />
                      </div>
                      <EditableText
                        className="plan-label"
                        value={p.label}
                        placeholder="What to read…"
                        onChange={(v) => updatePlan(p.id, { label: v })}
                      />
                    </div>
                    <div className="plan-right">
                      <EditableText
                        className="plan-meta-edit"
                        value={p.meta}
                        placeholder="pages / time"
                        onChange={(v) => updatePlan(p.id, { meta: v })}
                      />
                      <button className="btn icon ghost plan-remove" aria-label="Remove" onClick={() => removePlan(p.id)}>
                        <Icon name="close" className="ic-sm" />
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        ))}
        {total === 0 && <div className="empty">No tasks for today yet. Add one to get started.</div>}
      </div>
    </Card>
  );
}

export function CurrentlyReading({ state, setState, onPickBook, onManageContexts }) {
  const [adding, setAdding] = React.useState(false);
  const [draft, setDraft] = React.useState({ title: '', author: '', category: 'play', totalPages: 200, contextId: null });
  const [smartRaw, setSmartRaw] = React.useState('');
  const [smartHint, setSmartHint] = React.useState('');

  const palette = {
    play: 'oklch(88% 0.06 35)',
    secondary: 'oklch(86% 0.055 240)',
    philosophy: 'oklch(86% 0.055 155)',
    other: 'oklch(86% 0.055 310)',
  };

  const addBook = () => {
    if (!draft.title.trim()) return;
    const b = {
      id: 'b-' + Math.random().toString(36).slice(2, 8),
      title: draft.title.trim(),
      author: draft.author.trim() || '—',
      category: draft.category,
      totalPages: Math.max(1, +draft.totalPages || 200),
      pagesRead: 0, pagesToday: 0,
      color: palette[draft.category],
      addedOn: today(),
      contextId: draft.contextId,
    };
    setState((s) => ({ ...s, books: [...s.books, b], entries: { ...s.entries, [b.id]: [] }, activeBookId: b.id }));
    setDraft({ title: '', author: '', category: 'play', totalPages: 200, contextId: null });
    setSmartRaw('');
    setSmartHint('');
    setAdding(false);
  };

  const applySmartInput = () => {
    const parsed = parseBookIntake(smartRaw);
    if (!parsed) return;
    setDraft((d) => ({
      ...d,
      title: parsed.title || d.title,
      author: parsed.author || d.author,
      category: parsed.category || d.category,
      totalPages: parsed.totalPages || d.totalPages,
    }));
    setSmartHint(
      parsed.title
        ? `Parsed as ${parsed.title}${parsed.author ? ` by ${parsed.author}` : ''}.`
        : 'I found an author, but still need a title.'
    );
  };

  const cancelAdd = () => {
    setAdding(false);
    setSmartRaw('');
    setSmartHint('');
  };

  const updateBook = (id, patch) => {
    setState((s) => ({ ...s, books: s.books.map((b) => b.id === id ? { ...b, ...patch, color: patch.category ? palette[patch.category] : b.color } : b) }));
  };

  const finishBook = (id) => {
    setState((s) => {
      const b = s.books.find((x) => x.id === id);
      if (!b) return s;
      const finished = {
        id: 'c-' + Math.random().toString(36).slice(2, 8),
        title: b.title, author: b.author, category: b.category,
        color: b.color, finishedOn: today(), totalPages: b.totalPages,
        entries: s.entries[id] || [],
      };
      const nextActive = s.activeBookId === id ? s.books.filter((x) => x.id !== id)[0]?.id : s.activeBookId;
      const nextEntries = { ...s.entries }; delete nextEntries[id];
      return { ...s, books: s.books.filter((x) => x.id !== id), entries: nextEntries, completed: [finished, ...s.completed], activeBookId: nextActive };
    });
  };

  const removeBook = (id) => {
    if (!confirm('Remove this book? Its journal entries will be discarded.')) return;
    setState((s) => {
      const nextEntries = { ...s.entries }; delete nextEntries[id];
      const nextActive = s.activeBookId === id ? s.books.filter((x) => x.id !== id)[0]?.id : s.activeBookId;
      return { ...s, books: s.books.filter((x) => x.id !== id), entries: nextEntries, activeBookId: nextActive };
    });
  };

  return (
    <Card
      title={`Currently reading · ${state.books.length}`}
      right={state.books.length > 0 ? <span className="card-sub">Click any field to edit</span> : <span className="card-sub">Start with one book</span>}
    >
      <div className="books">
        {state.books.map((b) => {
          const isActive = b.id === state.activeBookId;
          const pct = Math.min(100, Math.round((b.pagesRead / b.totalPages) * 100));
          return (
            <div key={b.id} className={`book ${isActive ? 'active' : ''}`} onClick={() => onPickBook(b.id)}>
              <div className="book-spine" style={{ background: b.color }}>
                <span style={{ fontStyle: 'italic' }}>{b.title.split(/\s+/).slice(0, 3).join(' ')}</span>
              </div>
              <div className="book-body">
                <h3 className="book-title">
                  <EditableText value={b.title} placeholder="Title" onChange={(v) => updateBook(b.id, { title: v })} />
                </h3>
                <div className="book-author">
                  <EditableText value={b.author} placeholder="Author" onChange={(v) => updateBook(b.id, { author: v })} />
                </div>
                <div className="book-meta">
                  <select
                    className="chip-select"
                    value={b.category}
                    onClick={(e) => e.stopPropagation()}
                    onChange={(e) => updateBook(b.id, { category: e.target.value })}
                    aria-label="Category"
                  >
                    <option value="play">Play</option>
                    <option value="secondary">Secondary</option>
                    <option value="philosophy">Philosophy</option>
                    <option value="other">Other</option>
                  </select>
                  <ContextChip
                    ctx={state.contexts.find((c) => c.id === b.contextId)}
                    contexts={state.contexts}
                    onChange={(cid) => updateBook(b.id, { contextId: cid })}
                    onManage={onManageContexts}
                  />
                </div>
                <div className="book-progress">
                  <ProgressBar value={b.pagesRead} total={b.totalPages} />
                  <span className="num pages-edit">
                    <input type="number" min="0" max={b.totalPages} value={b.pagesRead}
                      onClick={(e) => { e.stopPropagation(); e.target.select(); }}
                      onChange={(e) => updateBook(b.id, { pagesRead: Math.max(0, Math.min(b.totalPages, +e.target.value || 0)) })}
                      aria-label="Pages read" />
                    <span className="slash">/</span>
                    <input type="number" min="1" value={b.totalPages}
                      onClick={(e) => { e.stopPropagation(); e.target.select(); }}
                      onChange={(e) => {
                        const v = Math.max(1, +e.target.value || 1);
                        updateBook(b.id, { totalPages: v, pagesRead: Math.min(b.pagesRead, v) });
                      }}
                      aria-label="Total pages" />
                  </span>
                </div>
              </div>
              <div className="book-actions">
                <RowMenu items={[
                  { label: 'Mark finished', onClick: () => finishBook(b.id) },
                  { label: 'Remove', danger: true, onClick: () => removeBook(b.id) },
                ]} />
                <span className="pages-today">today <b>{b.pagesToday || 0}</b> pp</span>
                <span className="mono muted" style={{ fontSize: 11 }}>{pct}%</span>
              </div>
            </div>
          );
        })}
      </div>

      {state.books.length === 0 && !adding && (
        <div className="empty muted">Add what you're reading. Then write or dictate today's note and export when you want it in Obsidian.</div>
      )}

      {!adding ? (
        <button className="add-book" onClick={() => setAdding(true)}>
          <Icon name="plus" className="ic-sm" /> {state.books.length === 0 ? "Add what you're reading" : 'Add a book'}
        </button>
      ) : (
        <div className="add-book-form" style={{ marginTop: 12, display: 'grid', gap: 8 }}>
          <div className="smart-add">
            <div className="row" style={{ gap: 8 }}>
              <input
                className="timer-book-select grow"
                placeholder="Type anything: plato republic, Antigone 112pp, The Prince by Machiavelli"
                value={smartRaw}
                onChange={(e) => setSmartRaw(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    e.preventDefault();
                    applySmartInput();
                  }
                }}
                autoFocus
              />
              <button className="btn small" onClick={applySmartInput} disabled={!smartRaw.trim()}>Fill</button>
            </div>
            {smartHint && <div className="smart-add-hint">{smartHint}</div>}
          </div>
          <input className="timer-book-select" placeholder="Title" value={draft.title} onChange={(e) => setDraft({ ...draft, title: e.target.value })} />
          <input className="timer-book-select" placeholder="Author" value={draft.author} onChange={(e) => setDraft({ ...draft, author: e.target.value })} />
          <div className="row" style={{ gap: 8 }}>
            <select className="timer-book-select" style={{ width: 'auto', flex: 1 }} value={draft.category} onChange={(e) => setDraft({ ...draft, category: e.target.value })}>
              <option value="play">Play</option>
              <option value="secondary">Secondary</option>
              <option value="philosophy">Philosophy</option>
              <option value="other">Other</option>
            </select>
            <input type="number" className="timer-book-select" style={{ width: 100 }} placeholder="Pages" value={draft.totalPages} onChange={(e) => setDraft({ ...draft, totalPages: +e.target.value })} />
          </div>
          <select className="timer-book-select" value={draft.contextId || ''} onChange={(e) => setDraft({ ...draft, contextId: e.target.value || null })}>
            <option value="">No context</option>
            {state.contexts.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
          </select>
          <div className="row" style={{ justifyContent: 'flex-end', gap: 8 }}>
            <button className="btn ghost small" onClick={cancelAdd}>Cancel</button>
            <button className="btn primary small" onClick={addBook}>Add</button>
          </div>
        </div>
      )}
    </Card>
  );
}

function oklchToHex(oklch) {
  try {
    const canvas = document.createElement('canvas');
    canvas.width = canvas.height = 1;
    const ctx = canvas.getContext('2d');
    ctx.fillStyle = oklch;
    ctx.fillRect(0, 0, 1, 1);
    const [r, g, b] = ctx.getImageData(0, 0, 1, 1).data;
    return '#' + [r, g, b].map((v) => v.toString(16).padStart(2, '0')).join('');
  } catch { return '#888888'; }
}
function hexToOklch(hex) { return hex; }

export function ContextsPanel({ state, setState, onClose }) {
  const update = (id, patch) => setState((s) => ({ ...s, contexts: s.contexts.map((c) => c.id === id ? { ...c, ...patch } : c) }));
  const remove = (id) => {
    if (!confirm('Delete this context? Books and tasks will be unassigned.')) return;
    setState((s) => ({
      ...s,
      contexts: s.contexts.filter((c) => c.id !== id),
      books: s.books.map((b) => b.contextId === id ? { ...b, contextId: null } : b),
      plan: s.plan.map((p) => p.contextId === id ? { ...p, contextId: null } : p),
    }));
  };
  const add = () => {
    const palette = ['oklch(60% 0.14 240)', 'oklch(58% 0.15 35)', 'oklch(60% 0.12 155)', 'oklch(60% 0.12 310)', 'oklch(58% 0.14 85)'];
    setState((s) => ({
      ...s,
      contexts: [...s.contexts, {
        id: 'ctx-' + Math.random().toString(36).slice(2, 8),
        name: 'New context',
        color: palette[s.contexts.length % palette.length],
        note: '',
        schedule: null,
      }],
    }));
  };
  const updateSchedule = (id, patch) => {
    setState((s) => ({
      ...s,
      contexts: s.contexts.map((c) => {
        if (c.id !== id) return c;
        const schedule = { ...(c.schedule || { day: null, start: '', end: '' }), ...patch };
        const allEmpty = schedule.day == null && !schedule.start && !schedule.end;
        return { ...c, schedule: allEmpty ? null : schedule };
      }),
    }));
  };

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div className="modal" onClick={(e) => e.stopPropagation()}>
        <div className="modal-head">
          <h2>Contexts</h2>
          <button className="btn icon ghost" onClick={onClose} aria-label="Close"><Icon name="close" /></button>
        </div>
        <p className="modal-sub">
          Why you're reading each book — a seminar, a translation group, a project. Contexts group tasks in Today's Plan and can carry a recurring schedule.
        </p>
        <div className="ctx-list">
          {state.contexts.map((c) => (
            <div key={c.id} className="ctx-card" style={{ '--ctx': c.color }}>
              <div className="ctx-card-head">
                <input
                  type="color"
                  value={oklchToHex(c.color)}
                  onChange={(e) => update(c.id, { color: hexToOklch(e.target.value) })}
                  className="ctx-color-input"
                  aria-label="Context color"
                />
                <EditableText className="ctx-card-name" value={c.name} placeholder="Name" onChange={(v) => update(c.id, { name: v })} />
                <button className="btn icon ghost" aria-label="Delete context" onClick={() => remove(c.id)}>
                  <Icon name="close" className="ic-sm" />
                </button>
              </div>
              <EditableText className="ctx-card-note" value={c.note || ''} placeholder="Purpose / notes" onChange={(v) => update(c.id, { note: v })} multiline />
              <div className="ctx-schedule-row">
                <span className="mono muted" style={{ fontSize: 10, textTransform: 'uppercase', letterSpacing: '0.08em' }}>Schedule</span>
                <select
                  className="ctx-day"
                  value={c.schedule?.day ?? ''}
                  onChange={(e) => updateSchedule(c.id, { day: e.target.value === '' ? null : +e.target.value })}
                >
                  <option value="">No recurring day</option>
                  {DAY_LABELS.map((d, i) => <option key={i} value={i}>{d}</option>)}
                </select>
                <input
                  type="time"
                  value={c.schedule?.start || ''}
                  onChange={(e) => updateSchedule(c.id, { start: e.target.value })}
                  className="ctx-time"
                  aria-label="Start time"
                />
                <span className="muted">→</span>
                <input
                  type="time"
                  value={c.schedule?.end || ''}
                  onChange={(e) => updateSchedule(c.id, { end: e.target.value })}
                  className="ctx-time"
                  aria-label="End time"
                />
              </div>
            </div>
          ))}
        </div>
        <button className="btn" onClick={add} style={{ alignSelf: 'flex-start' }}>
          <Icon name="plus" className="ic-sm" /> New context
        </button>
      </div>
    </div>
  );
}

export function RecentlyFinished({ state, setState }) {
  const [expanded, setExpanded] = React.useState(null);
  const sorted = state.completed.slice().sort((a, b) => (b.finishedOn || '').localeCompare(a.finishedOn || ''));

  const restoreBook = (c) => {
    setState((s) => {
      const b = {
        id: 'b-' + Math.random().toString(36).slice(2, 8),
        title: c.title, author: c.author, category: c.category || 'other',
        totalPages: c.totalPages || 200, pagesRead: c.totalPages || 200, pagesToday: 0,
        color: c.color || 'oklch(86% 0.055 240)', addedOn: today(), contextId: null,
      };
      return {
        ...s,
        books: [...s.books, b],
        entries: { ...s.entries, [b.id]: c.entries || [] },
        completed: s.completed.filter((x) => x.id !== c.id),
        activeBookId: b.id,
      };
    });
  };

  if (sorted.length === 0) {
    return <Card title="Recently finished"><div className="empty muted">Nothing finished yet. Mark a book finished from its row menu and it will land here with its full journal.</div></Card>;
  }

  return (
    <Card title={`Recently finished · ${sorted.length}`} right={<span className="card-sub">Journals preserved</span>}>
      <div className="finished-list">
        {sorted.map((c) => {
          const isOpen = expanded === c.id;
          const entries = (c.entries || []).slice().sort((a, b) => b.date.localeCompare(a.date));
          return (
            <div key={c.id} className={`finished ${isOpen ? 'open' : ''}`}>
              <div className="finished-head" onClick={() => setExpanded(isOpen ? null : c.id)} role="button" tabIndex={0}>
                <div className="finished-spine" style={{ background: c.color || 'oklch(86% 0.055 240)' }} />
                <div className="finished-body">
                  <div className="finished-title serif">{c.title}</div>
                  <div className="finished-sub">
                    <span>{c.author}</span>
                    <span className="dot-sep">·</span>
                    <Chip category={c.category || 'other'} />
                    <span className="dot-sep">·</span>
                    <span className="mono">finished {formatDate(c.finishedOn)}</span>
                  </div>
                </div>
                <div className="finished-meta mono muted">
                  {entries.length} {entries.length === 1 ? 'entry' : 'entries'}
                  <svg className={`chev ${isOpen ? 'up' : ''}`} viewBox="0 0 24 24" width="14" height="14">
                    <path d="M6 9l6 6 6-6" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                </div>
              </div>
              {isOpen && (
                <div className="finished-detail">
                  {entries.length === 0 ? (
                    <div className="muted" style={{ fontSize: 13, padding: '8px 0' }}>No journal entries were captured for this book.</div>
                  ) : (
                    entries.map((e) => (
                      <div key={e.date} className="finished-entry">
                        <div className="finished-entry-head mono">
                          <span>{formatDate(e.date)}</span>
                          <span>{e.pages} pp</span>
                        </div>
                        <div className="finished-entry-body serif">{e.text}</div>
                      </div>
                    ))
                  )}
                  <div className="finished-actions">
                    <button className="btn small ghost" onClick={() => restoreBook(c)}>Move back to currently reading</button>
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </Card>
  );
}
