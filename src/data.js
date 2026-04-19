/* data.js — date helpers, storage */

export const STORAGE_KEY = 'reading-dashboard-v4';

export const today = () => new Date().toISOString().slice(0, 10);

export const isoDaysAgo = (n) => {
  const d = new Date();
  d.setDate(d.getDate() - n);
  return d.toISOString().slice(0, 10);
};

export const formatDate = (iso) => {
  const d = new Date(iso + 'T00:00:00');
  return d.toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
};

export const formatFullDate = (d = new Date()) =>
  d.toLocaleDateString(undefined, { weekday: 'long', month: 'long', day: 'numeric' });

export const mmss = (totalSeconds) => {
  const s = Math.max(0, Math.round(totalSeconds));
  const m = Math.floor(s / 60);
  const r = s % 60;
  return `${String(m).padStart(2, '0')}:${String(r).padStart(2, '0')}`;
};

export const DEFAULT_STATE = {
  books: [],
  entries: {},
  annotations: {},
  completed: [],
  plan: [],
  contexts: [],
  sessions: [],
  weeklyGoal: 3,
  streak: 0,
  focusScore: 0,
  theme: 'paper',
  activeBookId: null,
};

export function loadState() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return DEFAULT_STATE;
    const parsed = JSON.parse(raw);
    return { ...DEFAULT_STATE, ...parsed };
  } catch {
    return DEFAULT_STATE;
  }
}

export function saveState(state) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  } catch {}
}

export const CATEGORIES = {
  play: { label: 'Play', tone: 'oklch(55% 0.14 35)' },
  secondary: { label: 'Secondary', tone: 'oklch(55% 0.14 240)' },
  philosophy: { label: 'Philosophy', tone: 'oklch(55% 0.14 155)' },
  other: { label: 'Other', tone: 'oklch(55% 0.14 310)' },
};
