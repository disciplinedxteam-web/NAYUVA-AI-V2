import { useEffect, useRef, useState } from 'react';
import { BellRing } from 'lucide-react';

/** Bottom-right halo message: transparent glass card, travelling red rim, 5s countdown ring around the close button that pauses while hovered or pressed. */
export function HaloNotification({ message, onClose, duration = 5000, title = 'Nayuva update', action }: { message: string; onClose: () => void; duration?: number; title?: string; action?: { label: string; onClick: () => void; disabled?: boolean } }) {
  const [paused, setPaused] = useState(false);
  const left = useRef(duration); const started = useRef(0);
  const close = useRef(onClose); close.current = onClose;
  useEffect(() => { left.current = duration; }, [message, duration]);
  useEffect(() => {
    if (paused) return;
    started.current = Date.now();
    const t = window.setTimeout(() => close.current(), left.current);
    return () => { window.clearTimeout(t); left.current = Math.max(0, left.current - (Date.now() - started.current)); };
  }, [paused, message]);
  const r = 13, c = 2 * Math.PI * r;
  return <div key={message} className="halo-note" role="status" aria-live="polite" data-paused={paused || undefined}
    style={{ ['--halo-ms' as string]: `${duration}ms` }}
    onMouseEnter={() => setPaused(true)} onMouseLeave={() => setPaused(false)}
    onPointerDown={() => setPaused(true)} onPointerUp={() => setPaused(false)}>
    <span className="halo-snake" aria-hidden="true" />
    <span className="halo-rim" aria-hidden="true"><i /><i /><i /></span>
    <div className="halo-body">
      <span className="halo-icon" aria-hidden="true"><BellRing size={16} /></span>
      <div className="halo-text"><strong>{title}</strong><span>{message}</span>{action && <button type="button" className="halo-action" disabled={action.disabled} onClick={() => { action.onClick(); close.current(); }}>{action.label}</button>}</div>
      <button type="button" className="halo-close" aria-label="Dismiss message" onClick={() => close.current()}>
        <svg viewBox="0 0 32 32" aria-hidden="true"><circle cx="16" cy="16" r={r} className="halo-ring-bg" /><circle cx="16" cy="16" r={r} className="halo-ring" style={{ strokeDasharray: c, ['--halo-c' as string]: c }} /></svg>
        <span>×</span>
      </button>
    </div>
  </div>;
}
