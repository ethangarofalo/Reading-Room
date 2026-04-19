import React from 'react';
import { loadState, saveState, formatFullDate } from './data.js';
import { Icon } from './Icon.jsx';
import { Card } from './ui.jsx';
import { DeepWorkTimer } from './timer.jsx';
import {
  TodayPlan, CurrentlyReading, RecentlyFinished, ContextsPanel,
} from './library.jsx';
import { Journal } from './journal.jsx';
import { StatsStrip, Heatmap } from './stats.jsx';
import { FocusMode } from './focus.jsx';
import { Tweaks } from './tweaks.jsx';

const TABS = [
  { id: 'today',   label: 'Today' },
  { id: 'library', label: 'Library' },
  { id: 'journal', label: 'Journal' },
  { id: 'stats',   label: 'Stats' },
];

function useIsMobile() {
  const [isMobile, set] = React.useState(() => window.matchMedia('(max-width: 720px)').matches);
  React.useEffect(() => {
    const mq = window.matchMedia('(max-width: 720px)');
    const handler = (e) => set(e.matches);
    mq.addEventListener('change', handler);
    return () => mq.removeEventListener('change', handler);
  }, []);
  return isMobile;
}

export default function App() {
  const [state, setState] = React.useState(() => loadState());
  const [focusMode, setFocusMode] = React.useState(null);
  const [tweaksVisible, setTweaksVisible] = React.useState(false);
  const [contextsOpen, setContextsOpen] = React.useState(false);
  const [tab, setTab] = React.useState('today');
  const isMobile = useIsMobile();

  React.useEffect(() => {
    document.body.dataset.theme = state.theme || 'paper';
  }, [state.theme]);

  React.useEffect(() => { saveState(state); }, [state]);

  const handleTimerComplete = (session) => {
    if (session && session.enterFocus) setFocusMode(session.bookId);
  };

  const desktopLayout = (
    <div className="grid">
      <div className="col">
        <TodayPlan state={state} setState={setState} onManageContexts={() => setContextsOpen(true)} />
        <Card title="Deep-work timer" right={<span className="card-sub mono">pomodoro · stopwatch · countdown</span>}>
          <DeepWorkTimer state={state} setState={setState} onComplete={handleTimerComplete} />
        </Card>
        <Heatmap state={state} />
      </div>
      <div className="col">
        <CurrentlyReading
          state={state}
          setState={setState}
          onPickBook={(id) => setState((s) => ({ ...s, activeBookId: id }))}
          onManageContexts={() => setContextsOpen(true)}
        />
        <Journal state={state} setState={setState} />
        <RecentlyFinished state={state} setState={setState} />
      </div>
    </div>
  );

  const mobileLayout = (
    <div className="col" style={{ marginTop: 16 }}>
      {tab === 'today' && (
        <>
          <TodayPlan state={state} setState={setState} onManageContexts={() => setContextsOpen(true)} />
          <Card title="Deep-work timer" right={<span className="card-sub mono">pomodoro</span>}>
            <DeepWorkTimer state={state} setState={setState} onComplete={handleTimerComplete} />
          </Card>
        </>
      )}
      {tab === 'library' && (
        <>
          <CurrentlyReading
            state={state}
            setState={setState}
            onPickBook={(id) => setState((s) => ({ ...s, activeBookId: id }))}
            onManageContexts={() => setContextsOpen(true)}
          />
          <RecentlyFinished state={state} setState={setState} />
        </>
      )}
      {tab === 'journal' && <Journal state={state} setState={setState} />}
      {tab === 'stats' && <Heatmap state={state} />}
    </div>
  );

  return (
    <div className="app">
      <header className="topbar">
        <div className="brand">
          <span className="mark" />
          <h1>Reading Room</h1>
          <span className="sub mono">{formatFullDate()}</span>
        </div>
        <div className="topbar-right">
          <span className="today">
            {new Date().toLocaleTimeString(undefined, { hour: '2-digit', minute: '2-digit' })}
          </span>
          <button className="btn ghost small" onClick={() => setContextsOpen(true)}>
            <Icon name="book" className="ic-sm" /> Contexts
          </button>
          <button className="btn ghost small" onClick={() => setFocusMode(state.activeBookId)} disabled={!state.activeBookId}>
            <Icon name="focus" className="ic-sm" /> Focus
          </button>
          <button className="btn ghost small" onClick={() => setTweaksVisible((v) => !v)} aria-label="Settings">
            <Icon name="settings" className="ic-sm" />
          </button>
        </div>
      </header>

      <StatsStrip state={state} />

      {isMobile && (
        <nav className="tabbar" role="tablist">
          {TABS.map((t) => (
            <button
              key={t.id}
              role="tab"
              aria-selected={tab === t.id}
              className={`tabbar-btn ${tab === t.id ? 'active' : ''}`}
              onClick={() => setTab(t.id)}
            >
              {t.label}
            </button>
          ))}
        </nav>
      )}

      <div style={{ height: 16 }} />
      {isMobile ? mobileLayout : desktopLayout}

      {contextsOpen && <ContextsPanel state={state} setState={setState} onClose={() => setContextsOpen(false)} />}
      {focusMode && (
        <FocusMode state={state} setState={setState} bookId={focusMode} onExit={() => setFocusMode(null)} />
      )}
      <Tweaks state={state} setState={setState} visible={tweaksVisible} onClose={() => setTweaksVisible(false)} />
    </div>
  );
}
