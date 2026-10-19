import { useEffect, useRef, useState, type ReactNode } from 'react';
import { Search, X } from 'lucide-react';

/** Round search button beside a toggle; opening it expands a search field over the toggle, closing clears it. */
export function SearchToggle({ value, onChange, placeholder = 'Search baby or caregiver', label, children }: { value: string; onChange: (v: string) => void; placeholder?: string; label: string; children: ReactNode }) {
  const [open, setOpen] = useState(Boolean(value));
  const ref = useRef<HTMLInputElement>(null);
  useEffect(() => { if (open) ref.current?.focus(); }, [open]);
  const close = () => { onChange(''); setOpen(false); };
  return (
    <div className={`search-toggle ${open ? 'is-open' : ''}`}>
      {!open && <button type="button" className="search-toggle-btn" aria-label={`Open search: ${label}`} onClick={() => setOpen(true)}><Search /></button>}
      <div className="search-toggle-slot" aria-hidden={open} inert={open ? true : undefined}>{children}</div>
      {open && <>
        <label className="search-toggle-field"><Search aria-hidden="true" /><input ref={ref} aria-label={label} placeholder={placeholder} value={value} onChange={(e) => onChange(e.target.value)} onKeyDown={(e) => e.key === 'Escape' && close()} /></label>
        <button type="button" className="search-toggle-btn" aria-label="Close search" onClick={close}><X /></button>
      </>}
    </div>
  );
}
