import { useEffect, useState } from 'react';
import { Bell } from 'lucide-react';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { HistoryButton, HistoryScreen } from './history-screen';
import { SearchToggle } from '@/components/ui/search-toggle';
import { GlassToggle } from '@/components/ui/glass-toggle';
import { parseCard } from '@/lib/care-card';
import { CareTicket } from './care-ticket';

type Event = { id: string; kind: string; summary: string; created_at: string };
type Card = { id: string; created_at: string; summary_text: string | null; reviewed: boolean; review_note?: string | null; category: string };

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
  const [open, setOpen] = useState(false), [tab, setTab] = useState('all'), [search, setSearch] = useState('');
  const counts = { all: cards.length, reviewed: cards.filter(c => c.reviewed).length, awaiting: cards.filter(c => !c.reviewed).length };
  const list = cards.filter(c => tab === 'all' || (tab === 'reviewed') === c.reviewed).filter(c => `${c.category} ${c.summary_text ?? ''}`.toLowerCase().includes(search.toLowerCase()));
  return <>
    <HistoryButton label="Svara history" onClick={() => setOpen(true)} />
    {open && <HistoryScreen title="Svara history" description="Your past check-ins and Health Cards." onClose={() => setOpen(false)}>
      <div className="ws-bar"><SearchToggle label="Search your Health Cards" placeholder="Search topics" value={search} onChange={setSearch}><GlassToggle value={tab} onChange={setTab} options={[{ key: 'all', label: 'All', count: counts.all }, { key: 'awaiting', label: 'Awaiting review', count: counts.awaiting }, { key: 'reviewed', label: 'Reviewed', count: counts.reviewed }]} /></SearchToggle></div>
      {list.length ? <div className="ticket-list">{list.map(c => { const card = parseCard(c.summary_text ?? ''); return <div key={c.id}>
        {card ? <CareTicket source="Svara" title={c.category} subtitle={c.reviewed ? 'Reviewed by care team' : 'Awaiting care team review'} date={when(c.created_at)} card={card} stamp={c.reviewed ? 'Reviewed' : null} stub={false} /> : <p className="vroom-muted">{when(c.created_at)} · {(c.summary_text ?? c.category)}</p>}
        {c.reviewed && c.review_note ? <p className="svara-history-note"><b>Care team note:</b> {c.review_note}</p> : null}
      </div>; })}</div> : <div className="care-empty"><p>{cards.length ? 'No Health Cards match.' : 'No Health Cards yet. Your check-ins will appear here.'}</p></div>}
    </HistoryScreen>}
  </>;
}
