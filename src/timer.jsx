import React from 'react';
import { CATEGORIES, mmss } from './data.js';
import { Icon } from './Icon.jsx';
import { Segmented } from './ui.jsx';

const notify = (title, body) => {
  if (typeof Notification === 'undefined') return;
  if (Notification.permission === 'granted') {
    try { new Notification(title, { body, silent: false }); } catch {}
  }
};

const requestNotifyPermission = () => {
  if (typeof Notification === 'undefined') return;
  if (Notification.permission === 'default') {
    Notification.requestPermission().catch(() => {});
  }
};

export function DeepWorkTimer({ state, setState, onComplete, compact, bookOverride }) {
  const [mode, setMode] = React.useState('pomodoro');
  const [startedAt, setStartedAt] = React.useState(null); // epoch ms when current run started, null if paused
  const [accumulated, setAccumulated] = React.useState(0); // seconds banked from prior runs in this session
  const [, setTick] = React.useState(0);
  const [pomStage, setPomStage] = React.useState('focus');
  const [pomFocusMin, setPomFocusMin] = React.useState(25);
  const [pomBreakMin, setPomBreakMin] = React.useState(5);
  const [countdownMin, setCountdownMin] = React.useState(60);
  const [bookId, setBookId] = React.useState(bookOverride || state.activeBookId || state.books[0]?.id);

  const running = startedAt != null;
  const elapsed = Math.floor(accumulated + (running ? (Date.now() - startedAt) / 1000 : 0));

  // Refs for use inside callbacks/effects to avoid stale closures
  const bookIdRef = React.useRef(bookId);
  React.useEffect(() => { bookIdRef.current = bookId; }, [bookId]);
  const setStateRef = React.useRef(setState);
  React.useEffect(() => { setStateRef.current = setState; }, [setState]);
  const onCompleteRef = React.useRef(onComplete);
  React.useEffect(() => { onCompleteRef.current = onComplete; }, [onComplete]);

  React.useEffect(() => {
    if (bookOverride) setBookId(bookOverride);
  }, [bookOverride]);

  React.useEffect(() => {
    if (bookOverride) return;
    if (bookId && state.books.some((b) => b.id === bookId)) return;
    setBookId(state.activeBookId || state.books[0]?.id || null);
  }, [bookOverride, bookId, state.activeBookId, state.books]);

  // Wake lock while running (mobile-friendly)
  React.useEffect(() => {
    if (!running || !('wakeLock' in navigator)) return;
    let lock;
    let cancelled = false;
    navigator.wakeLock.request('screen').then((l) => {
      if (cancelled) { l.release().catch(() => {}); return; }
      lock = l;
    }).catch(() => {});
    return () => {
      cancelled = true;
      if (lock) lock.release().catch(() => {});
    };
  }, [running]);

  // UI tick — only for re-render; truth lives in timestamps
  React.useEffect(() => {
    if (!running) return;
    const i = setInterval(() => setTick((t) => t + 1), 1000);
    const onVis = () => setTick((t) => t + 1);
    document.addEventListener('visibilitychange', onVis);
    return () => {
      clearInterval(i);
      document.removeEventListener('visibilitychange', onVis);
    };
  }, [running]);

  const logSession = React.useCallback((minutes) => {
    const id = bookIdRef.current;
    if (!minutes || minutes < 1 || !id) return;
    const d = new Date();
    const session = {
      date: d.toISOString().slice(0, 10),
      startHour: d.getHours(),
      minutes: Math.round(minutes),
      bookId: id,
    };
    setStateRef.current((s) => ({ ...s, sessions: [...s.sessions, session] }));
    if (navigator.vibrate) navigator.vibrate(80);
    onCompleteRef.current && onCompleteRef.current(session);
  }, []);

  // Pomodoro stage transitions — timestamp-driven
  React.useEffect(() => {
    if (mode !== 'pomodoro' || !running) return;
    const target = (pomStage === 'focus' ? pomFocusMin : pomBreakMin) * 60;
    if (elapsed >= target) {
      if (pomStage === 'focus') {
        logSession(target / 60);
        notify('Focus complete', `Time for a ${pomBreakMin}-minute break.`);
        setPomStage('break');
      } else {
        notify('Break over', 'Back to the page.');
        setPomStage('focus');
      }
      setAccumulated(0);
      setStartedAt(Date.now());
    }
  }, [elapsed, running, mode, pomStage, pomFocusMin, pomBreakMin, logSession]);

  // Countdown completion
  React.useEffect(() => {
    if (mode !== 'countdown' || !running) return;
    if (elapsed >= countdownMin * 60) {
      logSession(countdownMin);
      notify('Session complete', `${countdownMin} minutes logged.`);
      setStartedAt(null);
      setAccumulated(0);
    }
  }, [elapsed, running, mode, countdownMin, logSession]);

  const start = () => {
    requestNotifyPermission();
    setStartedAt(Date.now());
  };

  const pause = () => {
    if (startedAt != null) {
      setAccumulated((a) => a + (Date.now() - startedAt) / 1000);
      setStartedAt(null);
    }
  };

  const toggle = () => (running ? pause() : start());

  const stop = () => {
    const finalElapsed = Math.floor(accumulated + (running ? (Date.now() - startedAt) / 1000 : 0));
    if (mode === 'stopwatch' && finalElapsed >= 60) logSession(finalElapsed / 60);
    if (mode === 'pomodoro' && pomStage === 'focus' && finalElapsed >= 60) logSession(finalElapsed / 60);
    if (mode === 'countdown' && finalElapsed >= 60) logSession(finalElapsed / 60);
    setStartedAt(null);
    setAccumulated(0);
    setPomStage('focus');
  };

  const switchMode = (v) => {
    setMode(v);
    setStartedAt(null);
    setAccumulated(0);
    setPomStage('focus');
  };

  let display, total, label;
  if (mode === 'pomodoro') {
    total = (pomStage === 'focus' ? pomFocusMin : pomBreakMin) * 60;
    display = mmss(Math.max(0, total - elapsed));
    label = pomStage === 'focus' ? 'Focus' : 'Break';
  } else if (mode === 'stopwatch') {
    total = 0;
    display = mmss(elapsed);
    label = 'Stopwatch';
  } else {
    total = countdownMin * 60;
    display = mmss(Math.max(0, total - elapsed));
    label = 'Countdown';
  }

  const pct = total > 0 ? Math.min(1, elapsed / total) : (mode === 'stopwatch' ? (elapsed % 3600) / 3600 : 0);
  const R = compact ? 110 : 78;
  const C = 2 * Math.PI * R;
  const activeBook = state.books.find((b) => b.id === bookId);
  const hasBooks = state.books.length > 0;

  return (
    <div className={`timer ${compact ? 'compact' : ''}`}>
      <div className={`dial ${compact ? 'focus-dial' : ''}`} style={compact ? { '--size': '260px' } : {}}>
        <svg viewBox={`0 0 ${R * 2 + 12} ${R * 2 + 12}`} width="100%" height="100%">
          <circle className="track" cx={R + 6} cy={R + 6} r={R} />
          <circle className="prog" cx={R + 6} cy={R + 6} r={R}
            strokeDasharray={C} strokeDashoffset={C * (1 - pct)} />
        </svg>
        <div className="dial-readout">
          <div className="dial-time">{display}</div>
          <div className="dial-label">
            {running && <span className="pulse" />}
            {label}
          </div>
        </div>
      </div>

      <div className="timer-controls">
        <Segmented
          value={mode}
          onChange={switchMode}
          options={[
            { value: 'pomodoro', label: 'Pomodoro' },
            { value: 'stopwatch', label: 'Stopwatch' },
            { value: 'countdown', label: 'Countdown' },
          ]}
        />

        {mode === 'pomodoro' && (
          <div className="timer-row">
            <span className="timer-duration">
              focus
              <input type="number" min="5" max="120" value={pomFocusMin}
                onChange={(e) => setPomFocusMin(Math.max(1, +e.target.value || 25))} />
              min
            </span>
            <span className="timer-duration">
              break
              <input type="number" min="1" max="60" value={pomBreakMin}
                onChange={(e) => setPomBreakMin(Math.max(1, +e.target.value || 5))} />
              min
            </span>
          </div>
        )}
        {mode === 'countdown' && (
          <div className="timer-row">
            <span className="timer-duration">
              target
              <input type="number" min="5" max="240" value={countdownMin}
                onChange={(e) => setCountdownMin(Math.max(1, +e.target.value || 60))} />
              min
            </span>
          </div>
        )}

        {!compact && (
          <select className="timer-book-select" value={bookId || ''} onChange={(e) => setBookId(e.target.value)}>
            {!hasBooks && <option value="">Add a book first</option>}
            {state.books.map((b) => (
              <option key={b.id} value={b.id}>
                {CATEGORIES[b.category].label} · {b.title}
              </option>
            ))}
          </select>
        )}

        <div className="timer-row">
          <button className="btn primary" onClick={toggle} disabled={!hasBooks}>
            <Icon name={running ? 'pause' : 'play'} />
            {running ? 'Pause' : 'Start'}
          </button>
          <button className="btn" onClick={stop} disabled={!running && elapsed === 0}>
            <Icon name="reset" /> Reset
          </button>
          {!compact && (
            <button className="btn ghost" onClick={() => onComplete && onComplete({ enterFocus: true, bookId })} disabled={!bookId}>
              <Icon name="focus" /> Focus mode
            </button>
          )}
        </div>

        {!compact && !hasBooks && (
          <div className="timer-stage muted">Add what you're reading before starting a session.</div>
        )}

        {!compact && activeBook && (
          <div className="timer-stage muted">
            reading <span className="serif" style={{ color: 'var(--ink-2)', fontStyle: 'italic' }}>{activeBook.title}</span>
          </div>
        )}
      </div>
    </div>
  );
}
