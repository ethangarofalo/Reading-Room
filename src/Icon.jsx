export function Icon({ name, className = 'ic', style }) {
  const paths = {
    play: <polygon points="6,4 20,12 6,20" />,
    pause: (<><rect x="6" y="4" width="4" height="16" rx="1" /><rect x="14" y="4" width="4" height="16" rx="1" /></>),
    reset: (<path d="M4 12a8 8 0 1 0 3-6.2M4 4v5h5" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />),
    plus: (<path d="M12 5v14M5 12h14" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />),
    check: (<path d="M5 12l4 4 10-10" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />),
    close: (<path d="M6 6l12 12M18 6L6 18" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />),
    focus: (<><circle cx="12" cy="12" r="3" fill="none" stroke="currentColor" strokeWidth="1.6" /><path d="M12 3v3M12 18v3M3 12h3M18 12h3" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" /></>),
    book: (<path d="M4 4h6a3 3 0 0 1 3 3v13a2 2 0 0 0-2-2H4zM20 4h-6a3 3 0 0 0-3 3v13a2 2 0 0 1 2-2h7z" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinejoin="round" />),
    flame: (<path d="M12 3s4 4 4 8a4 4 0 0 1-8 0c0-1.5 1-2.5 1-2.5s-1 3 1 4c1 .5 2-.5 2-2 0-3-3-4-3-4s3-1 3-3.5z" fill="currentColor" stroke="none" />),
    clock: (<><circle cx="12" cy="12" r="8" fill="none" stroke="currentColor" strokeWidth="1.6" /><path d="M12 7v5l3 2" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" /></>),
    mic: (<><path d="M12 14a3 3 0 0 0 3-3V6a3 3 0 0 0-6 0v5a3 3 0 0 0 3 3Z" fill="none" stroke="currentColor" strokeWidth="1.6" /><path d="M6 10v1a6 6 0 0 0 12 0v-1M12 17v4M9 21h6" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" /></>),
    settings: (<><circle cx="12" cy="12" r="3" fill="none" stroke="currentColor" strokeWidth="1.6" /><path d="M12 2v3M12 19v3M4.2 4.2l2.1 2.1M17.7 17.7l2.1 2.1M2 12h3M19 12h3M4.2 19.8l2.1-2.1M17.7 6.3l2.1-2.1" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" /></>),
  };
  return (
    <svg className={className} style={style} viewBox="0 0 24 24" aria-hidden="true">
      {paths[name]}
    </svg>
  );
}
