import { useEffect, useState } from 'react';
import { Bell, History, X } from 'lucide-react';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { Dialog, DialogContent, DialogTitle } from '@/components/ui/dialog';
import { parseCard } from '@/lib/care-card';
import { CareTicket } from './care-ticket';

type Event = { id: string; kind: string; summary: string; created_at: string };
type Card = { id: string; created_at: string; summary_text: string; reviewed: boolean; review_note?: string | null; category: string };

// Maps a real care event to the workspace where it lives.
export function sectionFor(kind: string, role: string) {
  if (kind === 'Appointment' || kind === 'Follow-up') return 'milan';
  if (kind === 'Care Plan') return role === 'care-team' ? 'care-plan' : 'sutra';
  if (kind === 'Svara' || kind === 'Review' || kind === 'Home Update') return role === 'care-team' ? 'updates' : 'svara';
  if (kind === 'Clinical Note') return role === 'care-team' ? 'lekha' : 'sutra';
  return 'home';
}
const when = (d: string) => new Date(d).toLocaleString('en-IN', { day: 'numeric', month: 'short', hour: 'numeric', minute: '2-digit' });

export function NotificationBell({ role, events, onOpen }: { role: string; events: Event[]; onOpen: (section: string) => void }) {
  const key = `nayuva-seen-${role}`;
  const [seen, setSeen] = useState('');
  useEffect(() => { setSeen(localStorage.getItem(key) ?? ''); }, [key]);
  const items = events.slice(0, 15), unread = items.filter(e => e.created_at > seen).length;
  function markRead(open: boolean) { if (!open && items[0]) { localStorage.setItem(key, items[0].created_at); setSeen(items[0].created_at); } }
  return <DropdownMenu onOpenChange={markRead}>
    <DropdownMenuTrigger asChild><button type="button" className="notify-bell" aria-label={`Notifications${unread ? `, ${unread} new` : ''}`}><Bell />{unread > 0 && <span>{unread > 9 ? '9+' : unread}</span>}</button></DropdownMenuTrigger>
    <DropdownMenuContent align="end" sideOffset={8} className="nv-select-menu notify-menu">
      <p className="pill-menu-note">Notifications</p>
      {items.length ? items.map(e => <DropdownMenuItem key={e.id} onSelect={() => onOpen(sectionFor(e.kind, role))} className={e.created_at > seen ? 'is-new' : ''}>
        <div><b>{e.kind}</b><span>{e.summary}</span><small>{when(e.created_at)}</small></div>
      </DropdownMenuItem>) : <p className="notify-empty">No updates yet.</p>}
    </DropdownMenuContent>
  </DropdownMenu>;
}

export function SvaraHistory({ cards }: { cards: Card[] }) {
  const [open, setOpen] = useState(false);
  return <>
    <button type="button" className="svara-history-btn" aria-label="Svara history" title="Past Health Cards" onClick={() => setOpen(true)}><History /></button>
    <Dialog open={open} onOpenChange={setOpen}><DialogContent className="svara-history-dialog">
      <div className="flex items-center justify-between"><DialogTitle>Your past Health Cards</DialogTitle><button type="button" aria-label="Close" onClick={() => setOpen(false)}><X /></button></div>
      <div className="svara-history-list">{cards.length ? cards.map(c => { const card = parseCard(c.summary_text); return <div key={c.id}>
        {card ? <CareTicket source="Svara" title={c.category} subtitle={c.reviewed ? 'Reviewed by care team' : 'Awaiting care team review'} date={when(c.created_at)} card={card} stamp={c.reviewed ? 'Reviewed' : null} stub={false} /> : <p className="vroom-muted">{when(c.created_at)} · {c.summary_text.slice(0, 200)}</p>}
        {c.reviewed && c.review_note ? <p className="svara-history-note"><b>Care team note:</b> {c.review_note}</p> : null}
      </div>; }) : <p className="vroom-muted">No Health Cards yet. Your check-ins will appear here.</p>}</div>
    </DialogContent></Dialog>
  </>;
}
