import { useEffect, useRef, useState } from 'react';
import { Phone, Siren, X } from 'lucide-react';

const CONTACTS = [['careTeamContact', 'Care Team'], ['emergencyContact', 'Hospital'], ['ambulanceNumber', 'Ambulance'], ['afterHoursContact', 'After-hours']] as const;

/** Blinking round emergency icon that expands (like search) into direct call buttons; clicking outside closes it. */
export function EmergencyToggle({ settings }: { settings: Record<string, string> }) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    if (!open) return;
    const away = (e: PointerEvent) => { if (!ref.current?.contains(e.target as Node)) setOpen(false); };
    const esc = (e: KeyboardEvent) => { if (e.key === 'Escape') setOpen(false); };
    document.addEventListener('pointerdown', away); document.addEventListener('keydown', esc);
    return () => { document.removeEventListener('pointerdown', away); document.removeEventListener('keydown', esc); };
  }, [open]);
  return <div ref={ref} className={`emergency-toggle ${open ? 'is-open' : ''}`}>
    {open && <div className="emergency-tray" role="menu" aria-label="Emergency contacts">
      {CONTACTS.map(([key, label]) => settings[key]
        ? <a key={key} role="menuitem" className="emergency-chip" href={'tel:' + settings[key].replace(/[^\d+]/g, '')}><Phone />{label}</a>
        : <span key={key} className="emergency-chip is-off" aria-disabled="true">{label} · N/A</span>)}
    </div>}
    <button type="button" className="emergency-orb" aria-expanded={open} aria-label={open ? 'Close emergency contacts' : 'Emergency contacts'} onClick={() => setOpen((v) => !v)}>{open ? <X /> : <Siren />}</button>
  </div>;
}
