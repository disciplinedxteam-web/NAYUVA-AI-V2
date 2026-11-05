import { useEffect, type ReactNode } from 'react';
import { createPortal } from 'react-dom';
import { X } from 'lucide-react';

/**
 * Full-screen document view used everywhere a record is opened (history lists,
 * Milan past, Care Updates, Sutra sources). It sits above history screens and
 * side panels, closes with the X button or Escape, and locks page scrolling.
 */
export function DocumentViewer({ title, onClose, children }: { title: string; onClose: () => void; children: ReactNode }) {
  useEffect(() => {
    const k = (e: KeyboardEvent) => { if (e.key === 'Escape') { e.stopPropagation(); onClose(); } };
    window.addEventListener('keydown', k, true);
    const prev = document.body.style.overflow; document.body.style.overflow = 'hidden';
    return () => { window.removeEventListener('keydown', k, true); document.body.style.overflow = prev; };
  }, [onClose]);
  if (typeof document === 'undefined') return null;
  return createPortal(<div className="doc-fullscreen" role="dialog" aria-modal="true" aria-label={title}>
    <button type="button" className="doc-fullscreen-close" aria-label="Close document" title="Close" onClick={onClose}><X /></button>
    <div className="doc-fullscreen-body">{children}</div>
  </div>, document.body);
}

/** Plain record sheet for items that have no generated PDF (appointments, care events, the Care Plan). */
export function RecordSheet({ eyebrow, title, rows, body }: { eyebrow: string; title: string; rows: { label: string; value: string }[]; body?: string }) {
  return <article className="record-sheet">
    <p className="record-sheet-eyebrow">{eyebrow}</p>
    <h2>{title}</h2>
    {rows.length > 0 && <dl>{rows.map(r => <div key={r.label}><dt>{r.label}</dt><dd>{r.value || '—'}</dd></div>)}</dl>}
    {body && <p className="record-sheet-body">{body}</p>}
  </article>;
}
