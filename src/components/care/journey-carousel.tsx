import { useRef, type ReactNode } from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { Button } from '@/components/ui/button';

export function JourneyCarousel({ entries, active, onSelect }: { entries: { id: string; label: string; content: ReactNode }[]; active: string[]; onSelect: (id: string) => void }) {
  const track = useRef<HTMLDivElement>(null);
  function move(direction: number) {
    track.current?.scrollBy({ left: direction * 390, behavior: window.matchMedia('(prefers-reduced-motion: reduce)').matches ? 'instant' : 'smooth' });
  }
  return <div className="sutra-hanging" role="region" aria-label="Care journey cards">
    <svg className="journey-cord" viewBox="0 0 1000 60" preserveAspectRatio="none" aria-hidden="true"><path d="M0 12 Q500 75 1000 12" /></svg>
    <div className="hanging-track" ref={track}>
      {entries.map((entry) => <div className={`hanging-entry ${active.includes(entry.id) ? 'selected' : ''}`} key={entry.id}>
        <i className="journey-peg" aria-hidden="true" />
        <Button type="button" variant="ghost" className="journey-select" aria-pressed={active.includes(entry.id)} aria-label={`Select ${entry.label}`} onClick={() => onSelect(entry.id)}>{active.includes(entry.id) ? 'Selected for conversation' : 'Discuss this entry'}</Button>
        {entry.content}
      </div>)}
    </div>
    <div className="journey-navigation"><span>{entries.length} journey entries</span><Button variant="ghost" size="icon" aria-label="Earlier entries" onClick={() => move(-1)}><ChevronLeft /></Button><Button variant="ghost" size="icon" aria-label="Later entries" onClick={() => move(1)}><ChevronRight /></Button></div>
  </div>;
}