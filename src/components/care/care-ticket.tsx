import { useEffect, useRef, useState, type ReactNode } from 'react';
import { ArrowRight, Check, ChevronDown, HeartPulse } from 'lucide-react';
import { Button } from '@/components/ui/button';
import type { CareCard } from '@/lib/care-card';

export type TicketField = { label: string; value: string };
type Action = { label: string; onClick: () => void; disabled?: boolean };

/**
 * Nayuva universal care card — white card with a soft rose shine border,
 * pink inner detail tags, and one full-width contextual CTA. Shared by
 * Svara, Lekha, Milan and Sutra at a fixed universal size. When more than
 * four detail tags exist, the tag area scrolls with a visible hint.
 */
export function CareTicket({ source, title, subtitle, date, card, fields, stamp, action, stub = true, children, footer, variant }: {
  source: 'Svara' | 'Lekha' | 'Milan' | string; title: string; subtitle?: string | undefined; date?: string | undefined;
  card?: CareCard | null; fields?: TicketField[] | undefined; quote?: string | undefined; stamp?: string | null | undefined;
  action?: Action; stub?: boolean; stubLabel?: string; children?: ReactNode; footer?: ReactNode; variant?: 'appointment';
}) {
  const done = !!stamp;
  const items = card
    ? card.topics.map((t) => ({ label: t.title, value: t.finding || t.status, status: t.status }))
    : (fields ?? []).map((f) => ({ ...f, status: '' }));
  const priority = card?.priority;
  const tone = priority ? priority.split(' ')[0]!.toLowerCase() : '';
  const scrollable = variant !== 'appointment' && items.length > 4;

  const listRef = useRef<HTMLDivElement>(null);
  const [atEnd, setAtEnd] = useState(false);
  useEffect(() => {
    const el = listRef.current;
    if (!el || !scrollable) return;
    const onScroll = () => setAtEnd(el.scrollTop + el.clientHeight >= el.scrollHeight - 8);
    onScroll();
    el.addEventListener('scroll', onScroll, { passive: true });
    return () => el.removeEventListener('scroll', onScroll);
  }, [scrollable, items.length]);

  return (
    <div className={`shine-border ${tone ? `tone-${tone}` : ''} ${variant === 'appointment' ? 'is-appointment' : ''}`}>
      <article className="care-ticket shine-inner" data-no-translate>
        <header className="ticket-head">
          <span className="ticket-source"><HeartPulse aria-hidden="true" />{source} · {source === 'Milan' ? 'Appointment' : 'Care record'}</span>
          {priority && <span className={`ticket-priority p-${priority.split(' ')[0]?.toLowerCase()}`}>{priority}</span>}
        </header>
        <div className="ticket-heading">
          <strong className="ticket-title">{title}</strong>
          {(subtitle || date) && <p className="ticket-sub">{subtitle}{subtitle && date ? ' · ' : ''}{date}</p>}
        </div>
        <div className={`ticket-tags ${scrollable ? 'is-scrollable' : ''}`}>
          <div className="ticket-tags-scroll" ref={listRef}>
            {items.map((f, i) => (
              <div key={i} className={`ticket-tag s-${f.status.split(' ')[0]!.toLowerCase()}`}>
                <span className="ticket-tag-label">{f.label}</span>
                <span className="ticket-tag-value" title={f.value}>{f.value || '—'}</span>
              </div>
            ))}
          </div>
          {scrollable && !atEnd && (
            <button type="button" className="ticket-scroll-hint" onClick={() => listRef.current?.scrollBy({ top: 120, behavior: 'smooth' })}>
              <ChevronDown size={13} aria-hidden="true" /> Scroll for more details
            </button>
          )}
        </div>
        {children && <div className="ticket-controls">{children}</div>}
        <footer className="ticket-foot">
          {footer ? <div className="ticket-foot-actions">{footer}</div> : done ? (
            <span className="ticket-done" role="status"><Check size={14} aria-hidden="true" />{stamp}</span>
          ) : action && stub ? (
            <Button type="button" className="ticket-cta" disabled={action.disabled} onClick={action.onClick}>
              {action.label}<ArrowRight size={15} aria-hidden="true" />
            </Button>
          ) : (
            <span className="ticket-foot-note">{source === 'Milan' ? 'Appointment record' : 'Care journey'} · Nayuva AI</span>
          )}
        </footer>
      </article>
    </div>
  );
}
