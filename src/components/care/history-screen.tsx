import { useEffect, type ReactNode } from 'react';
import { createPortal } from 'react-dom';
import { History, X } from 'lucide-react';
import { lockScroll } from '@/lib/scroll-lock';

/** Round history button matching the search button. */
export function HistoryButton({ label, onClick }: { label: string; onClick: () => void }) {
  return <button type="button" className="search-toggle-btn" aria-label={label} title={label} onClick={onClick}><History /></button>;
}

/** Full-screen history view covering the dashboard (no sidebar); closes with the X button or Escape. */
export function HistoryScreen({ title, description, onClose, children }: { title: string; description?: string; onClose: () => void; children: ReactNode }) {
  useEffect(() => {
    const k = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose(); };
    window.addEventListener('keydown', k); const unlock = lockScroll();
    return () => { window.removeEventListener('keydown', k); unlock(); };
  }, [onClose]);
  if (typeof document === 'undefined') return null;
  return createPortal(<div className="history-screen" role="dialog" aria-modal="true" aria-label={title}>
    <header className="history-screen-top">
      <div><h1>{title}</h1>{description && <p>{description}</p>}</div>
      <button type="button" className="search-toggle-btn" aria-label="Close history" onClick={onClose}><X /></button>
    </header>
    <div className="history-screen-body">{children}</div>
  </div>, document.body);
}
