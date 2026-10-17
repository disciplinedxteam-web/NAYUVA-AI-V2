import { useState, type ReactNode } from 'react';
import { Check, ChevronLeft, ChevronRight, HeartPulse } from 'lucide-react';
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
  const [page, setPage] = useState(0);
  const items = card ? card.topics.map(t => ({label:t.title,value:t.finding || t.status,status:t.status})) : (fields ?? []).map(f => ({...f,status:''}));
  const pages = Math.max(1,Math.ceil(items.length / 4));
  const current = Math.min(page,pages-1);
  const visible = items.slice(current*4,current*4+4);
  const priority = card?.priority;
  return (
    <article className={`care-ticket ${stub ? '' : 'no-stub'} ${torn ? 'is-torn' : ''}`} data-no-translate>
      <div className="ticket-main">
        <header className="ticket-head">
          <span className="ticket-source"><HeartPulse aria-hidden="true" />{source} · {source === 'Milan' ? 'Appointment' : 'Care record'}</span>
          <strong className="ticket-title">{title}</strong>
          {priority && <span className={`ticket-priority p-${priority.split(' ')[0]?.toLowerCase()}`}>{priority}</span>}
        </header>
        {(subtitle || date) && <p className="ticket-sub">{subtitle}{subtitle && date ? ' · ' : ''}{date}</p>}
        <div className="ticket-body">
        <dl className="ticket-grid">{visible.map((f,i)=><div key={i} className="ticket-cell"><dt>{f.label}</dt><dd title={f.value}>{f.value || '—'}</dd></div>)}</dl>
        {pages > 1 && <div className="ticket-pages"><span>Details {current+1} of {pages}</span><Button variant="ghost" size="icon-xs" aria-label="Previous card details" disabled={current===0} onClick={()=>setPage(current-1)}><ChevronLeft/></Button><Button variant="ghost" size="icon-xs" aria-label="Next card details" disabled={current===pages-1} onClick={()=>setPage(current+1)}><ChevronRight/></Button></div>}
        </div>
        {children && <div className="ticket-controls">{children}</div>}
        <div className="ticket-record"><span>NAYUVA AI</span>{torn ? <span className="ticket-stamp" role="status"><Check size={13} />{stamp}</span> : action && stub ? <Button type="button" size="sm" disabled={action.disabled} onClick={action.onClick}>{action.label}</Button> : <span>{source==='Milan'?'Appointment record':'Care journey'}</span>}</div>
      </div>
    </article>
  );
}
