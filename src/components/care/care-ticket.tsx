import type { ReactNode } from 'react';
import { Check } from 'lucide-react';
import { Button } from '@/components/ui/button';
import type { CareCard } from '@/lib/care-card';

export type TicketField = { label: string; value: string };
type Action = { label: string; onClick: () => void; disabled?: boolean };

/**
 * Nayuva care ticket: a compact two-part pass shared by Svara, Lekha, Milan and Sutra.
 * Left: structured content. Right stub: one action. Acting tears the stub away and stamps the pass.
 * Journey views pass `stub={false}` for a display-only ticket.
 */
export function CareTicket({ source, title, subtitle, date, card, fields, stamp, action, stub = true, stubLabel, children }: {
  source: 'Svara' | 'Lekha' | 'Milan' | string; title: string; subtitle?: string | undefined; date?: string | undefined;
  card?: CareCard | null; fields?: TicketField[] | undefined; quote?: string | undefined; stamp?: string | null | undefined;
  action?: Action; stub?: boolean; stubLabel?: string; children?: ReactNode;
}) {
  const torn = !!stamp;
  const priority = card?.priority;
  return (
    <article className={`care-ticket ${stub ? '' : 'no-stub'} ${torn ? 'is-torn' : ''}`} data-no-translate>
      <div className="ticket-main">
        <header className="ticket-head">
          <span className="ticket-source"><i aria-hidden="true" />{source}</span>
          <strong className="ticket-title">{title}</strong>
          {priority && <span className={`ticket-priority p-${priority.split(' ')[0]?.toLowerCase()}`}>{priority}</span>}
        </header>
        {(subtitle || date) && <p className="ticket-sub">{subtitle}{subtitle && date ? ' · ' : ''}{date}</p>}
        <div className="ticket-body">
        {fields && fields.length > 0 && <dl className="ticket-grid">{fields.map((f) => <div key={f.label} className="ticket-cell"><dt>{f.label}</dt><dd>{f.value || '—'}</dd></div>)}</dl>}
        {card && <dl className="ticket-grid">{card.topics.map((t, i) => (
          <div key={i} className={`ticket-cell s-${t.status.split(' ')[0]?.toLowerCase()}`}>
            <dt><span className="ticket-dot" aria-hidden="true" />{t.title}</dt>
            <dd>{t.finding || t.status}</dd>
            <dd className="ticket-evidence">{t.status}</dd>
          </div>))}
        </dl>}
        {children}
        {card?.priorityReason && <footer className="ticket-foot">
          {card?.priorityReason && <small>{card.priorityReason}</small>}
        </footer>}
        </div>
        <div className="ticket-record"><span>NAYUVA / {source.toUpperCase()}</span>{torn ? <span className="ticket-stamp" role="status"><Check size={13} />{stamp}</span> : <span>Awaiting {stubLabel ?? 'review'}</span>}</div>
      </div>
      {stub && <div className="ticket-stub">
        <span className="ticket-stub-label">{stubLabel ?? source}</span>
        {torn ? <span className="ticket-stub-done"><Check aria-hidden="true" />{stamp}</span>
          : action && <Button type="button" className="ticket-action" disabled={action.disabled} onClick={action.onClick}>{action.label}</Button>}
      </div>}
    </article>
  );
}
