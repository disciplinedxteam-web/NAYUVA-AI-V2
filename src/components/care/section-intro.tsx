import { useEffect, useRef, useState } from 'react';
import { BookOpen, X } from 'lucide-react';
import { introFor, introKey } from '@/lib/section-intros';

const DURATION = 5000;

/** Bottom-right section guide. Hovering pauses the countdown; only "Okay, I Understand" is remembered for the session. */
export function SectionIntro({ role, section }: { role: string; section: string }) {
  const intro = introFor(role, section);
  const [open, setOpen] = useState(false);
  const [paused, setPaused] = useState(false);
  const left = useRef(DURATION), since = useRef(0), timer = useRef<number | undefined>(undefined);
  const run = () => { since.current = Date.now(); timer.current = window.setTimeout(() => setOpen(false), left.current); };
  const pause = () => { window.clearTimeout(timer.current); left.current = Math.max(0, left.current - (Date.now() - since.current)); setPaused(true); };
  const resume = () => { setPaused(false); run(); };
  useEffect(() => {
    setOpen(false); setPaused(false); window.clearTimeout(timer.current);
    if (!intro || sessionStorage.getItem(introKey(role, section))) return;
    left.current = DURATION; setOpen(true); run();
    return () => window.clearTimeout(timer.current);
  }, [role, section, intro]); // eslint-disable-line react-hooks/exhaustive-deps
  if (!intro || !open) return null;
  const close = () => { window.clearTimeout(timer.current); setOpen(false); };
  const acknowledge = () => { sessionStorage.setItem(introKey(role, section), '1'); close(); };
  return <aside key={`${role}-${section}`} className={`section-intro ${paused ? 'is-paused' : ''}`} role="status" aria-live="polite" onMouseEnter={pause} onMouseLeave={resume} onFocus={pause} onBlur={resume}>
    <div className="section-intro-top">
      <span className="section-intro-eyebrow">Section guide</span>
      <button type="button" className="section-intro-close" aria-label="Close guide" onClick={close}>
        <svg className="intro-ring" viewBox="0 0 36 36" aria-hidden="true"><circle cx="18" cy="18" r="16" className="ring-track" /><circle cx="18" cy="18" r="16" className="ring-progress" /></svg>
        <BookOpen size={14} className="intro-read" /><X size={14} className="intro-x" />
      </button>
    </div>
    <h2>{intro.title}</h2>
    <p>{intro.description}</p>
    <button type="button" className="section-intro-ok" onClick={acknowledge}>Okay, I Understand</button>
  </aside>;
}
