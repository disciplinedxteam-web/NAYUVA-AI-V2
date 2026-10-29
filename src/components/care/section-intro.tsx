import { useEffect, useState } from 'react';
import { Bell, X } from 'lucide-react';
import { introFor, introKey } from '@/lib/section-intros';

const DURATION = 5000;

/** Bottom-right section guide. Only "Okay, I Understand" is remembered for the browser session. */
export function SectionIntro({ role, section }: { role: string; section: string }) {
  const intro = introFor(role, section);
  const [open, setOpen] = useState(false);
  useEffect(() => {
    setOpen(false);
    if (!intro || sessionStorage.getItem(introKey(role, section))) return;
    setOpen(true);
    const t = window.setTimeout(() => setOpen(false), DURATION);
    return () => window.clearTimeout(t);
  }, [role, section, intro]);
  if (!intro || !open) return null;
  const acknowledge = () => { sessionStorage.setItem(introKey(role, section), '1'); setOpen(false); };
  return <aside key={`${role}-${section}`} className="section-intro" role="status" aria-live="polite">
    <div className="section-intro-top">
      <h2>{intro.title}</h2>
      <button type="button" className="section-intro-close" aria-label="Close guide" onClick={() => setOpen(false)}>
        <svg viewBox="0 0 36 36" aria-hidden="true"><circle cx="18" cy="18" r="16" className="ring-track" /><circle cx="18" cy="18" r="16" className="ring-progress" /></svg>
        <Bell size={14} className="intro-bell" /><X size={14} className="intro-x" />
      </button>
    </div>
    <p>{intro.description}</p>
    <button type="button" className="section-intro-ok" onClick={acknowledge}>Okay, I Understand</button>
  </aside>;
}
