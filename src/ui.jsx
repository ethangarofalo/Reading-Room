import { CATEGORIES } from './data.js';

export const Card = ({ title, right, children, className = '', flush }) => (
  <section className={`card ${flush ? 'flush' : ''} ${className}`}>
    {(title || right) && (
      <header className="card-header">
        {title && <h2 className="card-title">{title}</h2>}
        {right}
      </header>
    )}
    {children}
  </section>
);

export const Chip = ({ category }) => {
  const cat = CATEGORIES[category] || CATEGORIES.other;
  return (
    <span className="chip" data-cat={category}>
      <span className="dot" />
      {cat.label}
    </span>
  );
};

export const ProgressBar = ({ value, total, className = '' }) => {
  const pct = total > 0 ? Math.min(100, Math.round((value / total) * 100)) : 0;
  return (
    <div className={`bar ${className}`} role="progressbar" aria-valuenow={pct} aria-valuemin="0" aria-valuemax="100">
      <span style={{ width: `${pct}%` }} />
    </div>
  );
};

export const Segmented = ({ options, value, onChange, size }) => (
  <div className={`seg ${size === 'sm' ? 'sm' : ''}`} role="tablist">
    {options.map((opt) => (
      <button
        key={opt.value}
        aria-pressed={value === opt.value}
        onClick={() => onChange(opt.value)}
      >
        {opt.label}
      </button>
    ))}
  </div>
);
