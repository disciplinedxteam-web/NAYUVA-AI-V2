import { useEffect, useRef, type ReactNode } from 'react';

export type CompletionRow = { label: string; value: ReactNode };

/** Shared completion moment: character, eyebrow, title, a glass summary card, then closes by itself (no buttons). */
export function CompletionScreen({ character, eyebrow, title, detail, rows, note, onDone, delay = 3000 }: { character: ReactNode; eyebrow: string; title: string; detail?: ReactNode; rows?: CompletionRow[]; note?: ReactNode; onDone: () => void; delay?: number }) {
  const done = useRef(onDone); done.current = onDone;
  useEffect(() => { const t = window.setTimeout(() => done.current(), delay); return () => window.clearTimeout(t); }, [delay]);
  return <div className="completion-screen" role="status" style={{ ['--completion-ms' as string]: `${delay}ms` }}>
    <div className="completion-character">{character}</div>
    <span className="completion-eyebrow">{eyebrow}</span>
    <h2 className="completion-title">{title}</h2>
    {detail && <p className="completion-sub">{detail}</p>}
    <div className="completion-card">
      {rows?.length ? <dl className="completion-rows">{rows.map(r => <div key={r.label}><dt>{r.label}</dt><dd>{r.value}</dd></div>)}</dl> : null}
      {note && <p className="completion-note">{note}</p>}
      <span className="completion-timer" aria-hidden="true"><i /></span>
    </div>
  </div>;
}
