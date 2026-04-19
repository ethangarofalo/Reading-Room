import { buildObsidianMarkdown } from './obsidian.js';

export function Tweaks({ state, setState, visible, onClose }) {
  if (!visible) return null;

  const themes = [
    { id: 'paper', label: 'Paper' },
    { id: 'sepia', label: 'Sepia' },
    { id: 'dark',  label: 'Dark'  },
    { id: 'hc',    label: 'High-contrast' },
  ];

  const setTheme = (t) => {
    document.body.dataset.theme = t;
    setState((s) => ({ ...s, theme: t }));
  };

  const setGoal = (g) => setState((s) => ({ ...s, weeklyGoal: g }));

  const exportJson = () => {
    const blob = new Blob([JSON.stringify(state, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `reading-room-backup-${new Date().toISOString().slice(0,10)}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const exportObsidian = () => {
    const { markdown, count } = buildObsidianMarkdown(state);
    if (count === 0) {
      alert('No journal entries or annotations to export yet.');
      return;
    }

    const blob = new Blob([markdown], { type: 'text/markdown;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `reading-room-obsidian-${new Date().toISOString().slice(0,10)}.md`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const importJson = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      try {
        const parsed = JSON.parse(reader.result);
        if (confirm('Replace current data with the imported file?')) setState(parsed);
      } catch {
        alert('Could not parse file.');
      }
    };
    reader.readAsText(file);
  };

  return (
    <div className="tweaks">
      <div className="row" style={{ justifyContent: 'space-between', alignItems: 'center' }}>
        <h3 style={{ margin: 0 }}>Tweaks</h3>
        {onClose && <button className="btn small ghost" onClick={onClose}>Close</button>}
      </div>

      <div className="tweaks-row">
        <label>Theme</label>
        <div className="swatches">
          {themes.map((t) => (
            <button
              key={t.id}
              className={`swatch ${t.id}`}
              aria-pressed={state.theme === t.id}
              title={t.label}
              onClick={() => setTheme(t.id)}
            />
          ))}
        </div>
      </div>

      <div className="tweaks-row">
        <label>Works / week goal</label>
        <div className="row" style={{ gap: 6 }}>
          <button className="btn small" onClick={() => setGoal(Math.max(1, state.weeklyGoal - 1))}>−</button>
          <span className="mono" style={{ width: 18, textAlign: 'center' }}>{state.weeklyGoal}</span>
          <button className="btn small" onClick={() => setGoal(Math.min(14, state.weeklyGoal + 1))}>+</button>
        </div>
      </div>

      <div className="tweaks-row">
        <label>Backup</label>
        <div className="row" style={{ gap: 6 }}>
          <button className="btn small" onClick={exportJson}>Export</button>
          <label className="btn small" style={{ cursor: 'pointer' }}>
            Import
            <input type="file" accept="application/json" onChange={importJson} style={{ display: 'none' }} />
          </label>
        </div>
      </div>

      <div className="tweaks-row">
        <label>Obsidian</label>
        <button className="btn small" onClick={exportObsidian}>Export .md</button>
      </div>

      <div className="tweaks-note">
        Notes live in this browser's storage. Export regularly if they matter.
      </div>
    </div>
  );
}
