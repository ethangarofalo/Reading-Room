import React from 'react';
import { CATEGORIES, isoDaysAgo, today } from './data.js';
import { Icon } from './Icon.jsx';
import { Card, ProgressBar } from './ui.jsx';

export function StatsStrip({ state }) {
  const todayIso = today();

  const pagesToday = state.books.reduce((n, b) => n + (b.pagesToday || 0), 0);
  const minutesToday = state.sessions.filter((s) => s.date === todayIso).reduce((n, s) => n + s.minutes, 0);

  const weekAgo = new Date(); weekAgo.setDate(weekAgo.getDate() - 7);
  const weekCompleted = state.completed.filter((c) => new Date(c.finishedOn) >= weekAgo).length;

  return (
    <div className="stats">
      <div className="stat">
        <span className="label"><Icon name="flame" className="ic-sm" style={{ display: 'inline', verticalAlign: '-2px', marginRight: 4 }} /> Streak</span>
        <span className="value">{state.streak}<small>days</small></span>
        <div className="streak-dots" aria-hidden="true">
          {Array.from({ length: 7 }).map((_, i) => {
            const dayIso = isoDaysAgo(6 - i);
            const hasSession = state.sessions.some((s) => s.date === dayIso);
            return <span key={i} className={`${hasSession ? 'on' : ''} ${i === 6 ? 'today' : ''}`} />;
          })}
        </div>
      </div>

      <div className="stat">
        <span className="label">Pages today</span>
        <span className="value">{pagesToday}<small>pp</small></span>
        <span className="note">{minutesToday} min read today</span>
      </div>

      <div className="stat">
        <span className="label">Works this week</span>
        <span className="value">{weekCompleted}<small>/ {state.weeklyGoal}</small></span>
        <div style={{ marginTop: 6 }}>
          <ProgressBar value={weekCompleted} total={state.weeklyGoal} />
        </div>
      </div>

      <div className="stat">
        <span className="label">Focus score</span>
        <div className="row" style={{ gap: 10, alignItems: 'center', marginTop: 2 }}>
          <div style={{ position: 'relative', width: 44, height: 44, flexShrink: 0 }}>
            <svg width="44" height="44" viewBox="0 0 44 44" style={{ transform: 'rotate(-90deg)' }}>
              <circle className="track" cx="22" cy="22" r="18" />
              <circle
                className="prog"
                cx="22" cy="22" r="18"
                strokeDasharray={2 * Math.PI * 18}
                strokeDashoffset={2 * Math.PI * 18 * (1 - state.focusScore / 100)}
              />
            </svg>
            <span style={{ position: 'absolute', inset: 0, display: 'grid', placeItems: 'center', fontFamily: 'var(--font-mono)', fontSize: 11, fontWeight: 600 }}>{state.focusScore}</span>
          </div>
          <span className="note" style={{ margin: 0 }}>7-day avg · deep-work ratio</span>
        </div>
      </div>
    </div>
  );
}

export function ReadingVelocity({ state }) {
  const cutoff = isoDaysAgo(30);

  const bookCategory = new Map();
  state.books.forEach((b) => bookCategory.set(b.id, b.category));
  state.completed.forEach((b) => bookCategory.set(b.id, b.category));

  const minutesByCat = {};
  state.sessions.forEach((s) => {
    if (s.date < cutoff) return;
    const cat = bookCategory.get(s.bookId);
    if (!cat) return;
    minutesByCat[cat] = (minutesByCat[cat] || 0) + (s.minutes || 0);
  });

  const pagesByCat = {};
  const addEntries = (bookId, entries) => {
    const cat = bookCategory.get(bookId);
    if (!cat || !entries) return;
    entries.forEach((e) => {
      if (!e?.date || e.date < cutoff) return;
      pagesByCat[cat] = (pagesByCat[cat] || 0) + (Number(e.pages) || 0);
    });
  };
  state.books.forEach((b) => addEntries(b.id, state.entries[b.id]));
  state.completed.forEach((b) => addEntries(b.id, b.entries));

  const rows = Object.keys(CATEGORIES)
    .map((cat) => {
      const minutes = minutesByCat[cat] || 0;
      const pages = pagesByCat[cat] || 0;
      const pph = minutes > 0 ? (pages / (minutes / 60)) : 0;
      return { cat, minutes, pages, pph };
    })
    .filter((r) => r.minutes > 0 || r.pages > 0)
    .sort((a, b) => b.pph - a.pph);

  return (
    <Card title="Reading velocity" right={<span className="note" style={{ margin: 0 }}>last 30 days</span>}>
      {rows.length === 0 ? (
        <div className="muted" style={{ fontSize: 13 }}>Log a session and a few pages to see your pace.</div>
      ) : (
        <div className="velocity-grid">
          {rows.map((r) => (
            <div key={r.cat} className="velocity-row">
              <span className="velocity-cat" style={{ color: CATEGORIES[r.cat].tone }}>
                {CATEGORIES[r.cat].label}
              </span>
              <span className="velocity-pph mono">
                {r.pph > 0 ? r.pph.toFixed(1) : '—'}<small> pp/hr</small>
              </span>
              <span className="velocity-meta muted">
                {r.pages} pp · {Math.round(r.minutes)} min
              </span>
            </div>
          ))}
        </div>
      )}
    </Card>
  );
}

export function Heatmap({ state }) {
  const now = new Date();
  const days = Array.from({ length: 7 }).map((_, i) => {
    const d = new Date();
    d.setDate(d.getDate() - (6 - i));
    return { iso: d.toISOString().slice(0, 10), label: d.toLocaleDateString(undefined, { weekday: 'short' }) };
  });

  const grid = days.map((d) => {
    const hours = Array(24).fill(0);
    state.sessions.filter((s) => s.date === d.iso).forEach((s) => {
      hours[s.startHour] += s.minutes;
    });
    return { ...d, hours };
  });

  const intensity = (m) => {
    if (m === 0) return 0;
    if (m < 30) return 1;
    if (m < 60) return 2;
    if (m < 90) return 3;
    return 4;
  };

  const currentHour = now.getHours();
  const todayIdx = 6;

  return (
    <Card
      title="Reading heatmap"
      right={
        <div className="heatmap-legend">
          <span>less</span>
          <div className="scale">
            {[0, 1, 2, 3, 4].map((i) => (
              <span key={i} style={{ background: i === 0 ? 'var(--line)' : `color-mix(in oklch, var(--accent) ${[0, 15, 35, 60, 100][i]}%, var(--line))` }} />
            ))}
          </div>
          <span>more</span>
        </div>
      }
    >
      <div style={{ overflowX: 'auto' }}>
        <div style={{ minWidth: 560 }}>
          <div className="heatmap">
            {grid.map((row, ri) => (
              <React.Fragment key={row.iso}>
                <div className="hm-day">{row.label}</div>
                {row.hours.map((m, hi) => (
                  <div
                    key={hi}
                    className={`hm-cell ${ri === todayIdx && hi === currentHour ? 'now' : ''}`}
                    data-intensity={intensity(m)}
                    title={`${row.label} ${hi}:00 — ${m} min`}
                  />
                ))}
              </React.Fragment>
            ))}
          </div>
          <div className="heatmap-axis">
            <span />
            {Array.from({ length: 24 }).map((_, h) => <span key={h}>{h}</span>)}
          </div>
        </div>
      </div>
    </Card>
  );
}
