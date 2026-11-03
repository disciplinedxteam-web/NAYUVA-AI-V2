import { useEffect, useRef, type ReactNode } from 'react';

/** Shared completion moment: character, headline, short detail, then closes by itself (no buttons). */
export function CompletionScreen({ character, eyebrow, title, detail, note, onDone, delay = 3000 }: { character: ReactNode; eyebrow: string; title: string; detail?: ReactNode; note?: ReactNode; onDone: () => void; delay?: number }) {
  const done = useRef(onDone); done.current = onDone;
  useEffect(() => { const t = window.setTimeout(() => done.current(), delay); return () => window.clearTimeout(t); }, [delay]);
  return <div className="completion-screen" role="status" style={{ ['--completion-ms' as string]: `${delay}ms` }}>
    <div className="completion-character">{character}</div>
    <span className="completion-eyebrow">{eyebrow}</span>
    <h2 className="completion-title">{title}</h2>
    {detail && <p className="completion-sub">{detail}</p>}
    {note && <p className="completion-note">{note}</p>}
    <span className="completion-timer" aria-hidden="true"><i /></span>
  </div>;
}
