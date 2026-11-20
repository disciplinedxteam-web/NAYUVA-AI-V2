import { useEffect, useState } from 'react';
import { Link, useNavigate } from '@tanstack/react-router';
import { useServerFn } from '@tanstack/react-start';
import { useQuery } from '@tanstack/react-query';
import { ClipboardList, Menu, MessageCircleHeart, Phone, Search, Settings, Globe, ArrowLeft, PanelLeftClose, PanelLeftOpen } from 'lucide-react';
import GlassmorphismCta from '@/components/ui/glassmorphism-cta';
import type { AskSutraDoc } from './chat-history';
import { Button } from '@/components/ui/button';
import { GlassToggle } from '@/components/ui/glass-toggle';
import { SutraWorkspace } from '@/components/sutra/workspace';
import { getCareData, getChatThreads } from '@/lib/care.functions';
import { nextCheckin, type CarePlan, type DemoRole } from '@/lib/care-domain';
import { BrandWordmark } from '@/components/brand-wordmark';
import logo from '@/assets/nayuva-logo.png.asset.json';
import { Converse } from './converse';

type Data = Awaited<ReturnType<typeof getCareData>>;
export type ChatView = 'converse' | 'sutra';
export const DASHBOARD_TUTORIAL: Record<DemoRole, { label: string; url: string }> = {
  'care-team': { label: 'Watch Care Team Tutorial', url: 'https://www.youtube.com/watch?v=YaOMywsSfH4' },
  caregiver: { label: 'Watch Caregiver Tutorial', url: 'https://www.youtube.com/watch?v=TpY-vBkjNAc&list=PLdVklvLc6Jsk&index=5' },
};

/** Always-visible caregiver reminder above Sutra; both buttons open the existing Svara screens. */
function SvaraBanner({ data }: { data: Data }) {
  const baby = data.babies[0]; const navigate = useNavigate(); const [now, setNow] = useState<Date | null>(null);
  useEffect(() => { setNow(new Date()); const t = setInterval(() => setNow(new Date()), 30000); return () => clearInterval(t); }, []);
  if (!baby) return null;
  const cards = data.cards.filter(c => c.baby_id === baby.id); const slot = nextCheckin(baby.plan as unknown as CarePlan, baby.created_at, cards[0]?.created_at);
  const doneToday = cards.some(c => new Date(c.created_at).toDateString() === new Date().toDateString());
  const open = (channel: 'web' | 'phone') => { sessionStorage.setItem('svara-channel', channel); void navigate({ to: '/caregiver/$section', params: { section: 'svara' } }); };
  return <aside className="svara-banner" aria-label="Today's Svara check-in">
    <span className="svara-banner-icon"><MessageCircleHeart /></span>
    <div className="svara-banner-text"><strong>Today's Svara check-in{doneToday ? ' · sent' : ''}</strong><small>{now ? now.toLocaleString('en-IN', { weekday: 'short', day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit', timeZone: 'Asia/Kolkata' }) : ''}{!slot.due && !doneToday ? ' · next due soon' : ''}</small></div>
    <div className="svara-banner-actions"><Button size="sm" onClick={() => open('web')}><Globe />Talk on website</Button><Button size="sm" variant="outline" onClick={() => open('phone')}><Phone />Get a phone call</Button></div>
  </aside>;
}

export function ChatDashboard({ data, role, view }: { data: Data; role: DemoRole; view: ChatView }) {
  const navigate = useNavigate(); const threadsFn = useServerFn(getChatThreads);
  const threads = useQuery({ queryKey: ['chat-threads'], queryFn: () => threadsFn(), refetchInterval: 6000 });
  const team = role === 'care-team';
  const [babyId, setBabyId] = useState(''); const [open, setOpen] = useState(team); const [q, setQ] = useState('');
  useEffect(() => { if (!team) { setBabyId(data.babies[0]?.id ?? ''); return; } const saved = sessionStorage.getItem('nv-chat-baby'); setBabyId(data.babies.some(b => b.id === saved) ? saved! : data.babies[0]?.id ?? ''); if (sessionStorage.getItem('nv-panel') === 'closed') setOpen(false); if (window.matchMedia('(max-width:860px)').matches) setOpen(false); }, [role, data.babies.length]);
  const setPanel = (v: boolean) => { setOpen(v); if (team) sessionStorage.setItem('nv-panel', v ? 'open' : 'closed'); };
  const pick = (id: string) => { setBabyId(id); sessionStorage.setItem('nv-chat-baby', id); if (!team || window.matchMedia('(max-width:860px)').matches) setOpen(false); };
  const go = (v: string) => void navigate({ to: team ? '/care-team/$section' : '/caregiver/$section', params: { section: v } });
  const activeId = !team ? (data.babies[0]?.id ?? '') : (data.babies.some(b => b.id === babyId) ? babyId : data.babies[0]?.id ?? '');
  const baby = data.babies.find(b => b.id === activeId);
  const askSutra = (d: AskSutraDoc) => { go('sutra'); setTimeout(() => window.dispatchEvent(new CustomEvent('nv-ask-sutra', { detail: { babyId: activeId, ...d } })), 120); };
  const contacts = ([['careTeamContact', 'Care Team'], ['emergencyContact', 'Hospital Emergency'], ['ambulanceNumber', 'Ambulance'], ['afterHoursContact', 'After-hours']] as const).filter(([k]) => (data.settings as Record<string, string>)[k]); const t = DASHBOARD_TUTORIAL[role];
  const unreadTotal = Object.values(threads.data ?? {}).reduce((n, x) => n + x.unread, 0);
  const sorted = [...data.babies].filter(b => `${b.baby_name} ${b.caregiver_name}`.toLowerCase().includes(q.toLowerCase())).sort((a, b) => (threads.data?.[b.id]?.at ?? '').localeCompare(threads.data?.[a.id]?.at ?? ''));
  const foot = <div className="chat-picker-foot">
    {team && <Button variant="ghost" onClick={() => go('care-plan')}><ClipboardList />Care Plans</Button>}
    <Button variant="ghost" onClick={() => go('settings')}><Settings />Settings</Button>
    <Button variant="ghost" asChild><Link to="/"><ArrowLeft />Back to website</Link></Button>
  </div>;
  return <div className={`chat-dash role-${role} ${open ? 'picker-open' : ''}`}>
    {team && <aside className="chat-panel" aria-label="Caregiver profiles" aria-hidden={!open} inert={!open}>
      <div className="chat-panel-head"><Link to="/" className="chat-dash-brand"><img src={logo.url} alt="Nayuva AI logo" /><BrandWordmark /></Link><Button variant="ghost" size="icon" aria-label="Close profiles panel" title="Close panel" onClick={() => setPanel(false)}><PanelLeftClose /></Button></div>
      <label className="chat-picker-search"><Search size={15} /><input value={q} onChange={e => setQ(e.target.value)} placeholder="Search baby or caregiver" aria-label="Search caregiver profiles" /></label>
      <div className="chat-picker-list">{sorted.map(b => { const th = threads.data?.[b.id]; return <button type="button" key={b.id} className={`chat-picker-item ${b.id === activeId ? 'is-on' : ''}`} onClick={() => pick(b.id)}><span className="converse-avatar">{b.baby_name.charAt(0)}</span><span className="chat-picker-meta"><strong>{b.baby_name}</strong><small>{b.caregiver_name}{th?.last ? ` · ${th.last.slice(0, 40)}` : ''}</small></span>{th?.unread ? <i className="chat-badge">{th.unread}</i> : null}</button>; })}{!sorted.length && <p className="chat-picker-label">No profiles match.</p>}</div>
      {foot}
    </aside>}
    <div className="chat-main">
      <header className="chat-dash-top">
        <div className="chat-dash-left">
          {team ? (!open && <Button variant="ghost" size="icon" aria-label="Open profiles panel" title="Open panel" onClick={() => setPanel(true)} className="chat-dash-menu"><PanelLeftOpen />{unreadTotal > 0 && <i className="chat-badge">{unreadTotal}</i>}</Button>)
            : <Button variant="ghost" size="icon" aria-label="Open menu" aria-expanded={open} onClick={() => setOpen(true)} className="chat-dash-menu"><Menu /></Button>}
          {(!team || !open) && <Link to="/" className="chat-dash-brand"><img src={logo.url} alt="Nayuva AI logo" /><BrandWordmark /></Link>}
        </div>
        <GlassToggle label="Dashboard view" value={view} onChange={v => go(v)} options={[{ key: 'converse', label: team ? 'Converse with Caregiver' : 'Converse with Care Team', ...(!team && unreadTotal ? { count: unreadTotal } : {}) }, { key: 'sutra', label: 'Sutra AI' }]} />
        <div className="chat-dash-right"><GlassmorphismCta className="tutorial-tile" href={t.url} target="_blank" rel="noopener noreferrer" aria-label={`${t.label} (opens YouTube)`} title={t.label} label="Tutorial" avatarSrc={logo.url} /></div>
      </header>
      <div className="chat-dash-body">
        <div hidden={view !== 'converse'} className="chat-pane">{activeId ? <Converse key={activeId} data={data} role={role} babyId={activeId} onRead={() => void threads.refetch()} onAskSutra={askSutra} /> : <div className="converse-empty"><p>{team ? 'Create a Care Plan to start a conversation.' : 'Loading your conversation…'}</p></div>}</div>
        <div hidden={view !== 'sutra'} className="chat-pane chat-pane-sutra">{!team && <SvaraBanner data={data} />}{team && baby && <p className="chat-sutra-for">Sutra AI for <strong>{baby.baby_name}</strong> · {baby.caregiver_name}</p>}{activeId && <SutraWorkspace key={activeId} data={data} role={role} babyId={activeId} />}</div>
      </div>
    </div>
    {!team && <>
      {open && <button type="button" className="chat-picker-scrim" aria-label="Close menu" onClick={() => setOpen(false)} />}
      <aside className="chat-picker" aria-label="Menu" aria-hidden={!open}>
        <div className="chat-picker-head"><img src={logo.url} alt="" /><strong>Menu</strong></div>
        <div className="chat-picker-list"><p className="chat-picker-label">Emergency contacts</p>{contacts.length ? contacts.map(([k, l]) => <a key={k} className="chat-picker-item" href={'tel:' + (data.settings as Record<string, string>)[k]!.replace(/[^\d+]/g, '')}><span className="converse-avatar"><Phone size={15} /></span><span className="chat-picker-meta"><strong>{l}</strong><small>{(data.settings as Record<string, string>)[k]}</small></span></a>) : <p className="chat-picker-label">Contacts not configured yet.</p>}</div>
        {foot}
      </aside>
    </>}
    {team && open && <button type="button" className="chat-panel-scrim" aria-label="Close profiles panel" onClick={() => setPanel(false)} />}
  </div>;
}
