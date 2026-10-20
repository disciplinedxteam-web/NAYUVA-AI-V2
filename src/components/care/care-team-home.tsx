import { useEffect, useMemo, useState, type ReactNode } from 'react';
import { useServerFn } from '@tanstack/react-start';
import { useQuery } from '@tanstack/react-query';
import { Activity, ArrowRight, CalendarDays, ClipboardList, Clock, FileText, GitBranch, GripVertical, MapPin, MessageCircle, Phone, Users, Video } from 'lucide-react';
import DraggableWidgetGrid, { type WidgetItem } from '@/components/ui/draggable-widget-grid';
import { getCareData, getOnlineAppointments, getTaalRoster } from '@/lib/care.functions';
import { babyDay } from '@/lib/day-protocol';
import type { CarePlan } from '@/lib/care-domain';
import { OnlineMeeting } from './online-meeting';

type Data = Awaited<ReturnType<typeof getCareData>>;
type Go = (s: 'updates' | 'milan' | 'lekha' | 'sutra' | 'care-plan' | 'taal') => unknown;

const LAYOUT_KEY = 'nayuva-careteam-home-layout-v1';
const DEFAULT_LAYOUT: WidgetItem[] = [
  { id: 'newborns', size: 'sm', label: 'Newborns' },
  { id: 'cadence', size: 'sm', label: 'Taal cadence' },
  { id: 'triage', size: 'sm', label: 'Care Updates' },
  { id: 'plans', size: 'sm', label: 'Care Plans' },
  { id: 'offline', size: 'lg', label: 'In-person visits' },
  { id: 'online', size: 'lg', label: 'Video consultations' },
  { id: 'lekha', size: 'wide', label: 'Lekha backlog' },
  { id: 'taal', size: 'wide', label: 'Taal roster' },
  { id: 'sutra', size: 'wide', label: 'Ask Sutra' },
];
const SUGGESTIONS = ['Summarise feeding changes in the last 48 hours', 'What did the caregiver report most recently?', 'List open follow-ups for this baby'];
const tz = 'Asia/Kolkata';
const fmtDay = (v: string) => new Date(v).toLocaleDateString('en-IN', { day: '2-digit', timeZone: tz });
const fmtMon = (v: string) => new Date(v).toLocaleDateString('en-IN', { month: 'short', timeZone: tz });
const fmtTime = (v: string) => new Date(v).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit', timeZone: tz });
const fmtFull = (v: string) => new Date(v).toLocaleString('en-IN', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit', timeZone: tz });

function Shell({ title, meta, children }: { title: string; meta?: ReactNode; children: ReactNode }) {
  return <section className="bento-shell"><header><h3><GripVertical aria-hidden className="bento-grip" />{title}</h3>{meta && <span className="bento-meta">{meta}</span>}</header><div className="bento-body">{children}</div></section>;
}
const Big = ({ children, unit }: { children: ReactNode; unit?: string }) => <p className="bento-big">{children}{unit && <span>{'\u00a0'}{unit}</span>}</p>;
const Dot = ({ tone, pulse }: { tone: 'ok' | 'warn' | 'err' | 'brand'; pulse?: boolean }) => <span className={`bento-dot tone-${tone} ${pulse ? 'pulse' : ''}`} aria-hidden />;
const Link = ({ onClick, children = 'View all' }: { onClick: () => unknown; children?: ReactNode }) => <button type="button" className="bento-link" onClick={() => void onClick()}>{children}<ArrowRight /></button>;

export function CareTeamHome({ data, go, onPriority, onSelectBaby }: { data: Data; go: Go; onPriority: (p: string) => void; onSelectBaby: (id: string) => void }) {
  const getOnline = useServerFn(getOnlineAppointments); const getTaal = useServerFn(getTaalRoster);
  const online = useQuery({ queryKey: ['online-appointments', 'care-team'], queryFn: getOnline });
  const taal = useQuery({ queryKey: ['taal'], queryFn: getTaal, refetchInterval: 10000 });
  const [layout, setLayout] = useState<WidgetItem[] | null>(null);
  const [meeting, setMeeting] = useState(''); const [q, setQ] = useState(''); const [askBaby, setAskBaby] = useState('');
  useEffect(() => {
    try { const saved = JSON.parse(localStorage.getItem(LAYOUT_KEY) ?? 'null') as string[] | null;
      if (saved && saved.length === DEFAULT_LAYOUT.length && DEFAULT_LAYOUT.every(w => saved.includes(w.id))) { setLayout(saved.map(id => DEFAULT_LAYOUT.find(w => w.id === id)!)); return; }
    } catch { /* ignore corrupt layout */ }
    setLayout(DEFAULT_LAYOUT);
  }, []);

  const m = useMemo(() => {
    const now = Date.now(); const week = now - 7 * 86400000;
    const name = (id: string) => data.babies.find(b => b.id === id)?.baby_name ?? 'Baby';
    const upcoming = data.appointments.filter(a => !['Completed', 'Cancelled'].includes(a.status) && new Date(a.starts_at).getTime() >= now).sort((a, b) => a.starts_at.localeCompare(b.starts_at));
    const backlog = data.appointments.filter(a => a.status === 'Completed' && !data.notes.some(n => n.appointment_id === a.id)).sort((a, b) => b.starts_at.localeCompare(a.starts_at));
    const pending = data.cards.filter(c => !c.reviewed);
    return { now, name, upcoming, backlog, pending, newThisWeek: data.babies.filter(b => new Date(b.created_at).getTime() >= week).length };
  }, [data]);

  if (meeting) return <OnlineMeeting id={meeting} onClose={() => setMeeting('')} />;
  const onlineMap = new Map((online.data ?? []).map(o => [o.appointment_id, o.status]));
  const offline = m.upcoming.filter(a => !onlineMap.has(a.id)); const video = m.upcoming.filter(a => onlineMap.has(a.id));
  const rows = taal.data?.rows ?? []; const ranked = rows.filter(r => ['Active', 'Overdue', 'Unresponsive'].includes(r.status));
  const count = (s: string) => rows.filter(r => r.status === s).length;
  const adherence = ranked.length ? Math.round(count('Active') / ranked.length * 100) : null;
  const reviewedPct = data.cards.length ? Math.round((data.cards.length - m.pending.length) / data.cards.length * 100) : null;
  const ask = (text: string) => { if (!askBaby || !text.trim()) return; onSelectBaby(askBaby); sessionStorage.setItem('sutra-initial-query', text.trim()); sessionStorage.setItem('sutra-baby', askBaby); void go('sutra'); };
  const apptRow = (a: (typeof m.upcoming)[number], isVideo: boolean) => <article className="bento-item" key={a.id}>
    <div className="bento-date"><strong>{fmtDay(a.starts_at)}</strong><span>{fmtMon(a.starts_at)}</span></div>
    <div className="bento-item-body"><div className="bento-item-top"><strong>{m.name(a.baby_id)}</strong><span className={`bento-pill ${a.status === 'Confirmed' ? 'ok' : ''}`}>{a.status}</span></div>
      <small>{fmtTime(a.starts_at)} · {a.reason}</small>
      {isVideo ? <div className="bento-actions"><button type="button" className="bento-cta sm" disabled={onlineMap.get(a.id) !== 'ready'} onClick={() => setMeeting(a.id)}><Video />Join video room</button></div>
        : <small><MapPin className="inline size-3" /> {(a.location as Record<string, string>)['facilityName'] || 'Location not configured'}</small>}
    </div></article>;

  const render = (item: WidgetItem) => {
    switch (item.id) {
      case 'newborns': return <Shell title="Newborns" meta={<Users className="size-4" />}>
        <Big unit="in care">{data.babies.length}</Big><p className="bento-sub">{m.newThisWeek} added this week</p>
        <button type="button" className="bento-cta mt-auto" onClick={() => go('care-plan')}><Users />View profiles<ArrowRight /></button></Shell>;
      case 'cadence': return <Shell title="Taal cadence" meta="14 days">
        <Big unit={adherence === null ? '' : '% active'}>{adherence === null ? '—' : adherence}</Big>
        <dl className="bento-rows mt-auto">{([['Active', 'ok'], ['Overdue', 'warn'], ['Unresponsive', 'err']] as const).map(([s, t]) => <div key={s}><dt><Dot tone={t} />{s}</dt><dd>{count(s)}</dd><span className="bento-bar"><i className={`tone-${t}`} style={{ width: `${ranked.length ? count(s) / ranked.length * 100 : 0}%` }} /></span></div>)}</dl></Shell>;
      case 'triage': return <Shell title="Care Updates" meta={<span className="bento-live"><Dot tone={m.pending.length ? 'brand' : 'ok'} pulse />{m.pending.length} pending</span>}>
        <Big unit={reviewedPct === null ? '' : '% reviewed'}>{reviewedPct === null ? '—' : reviewedPct}</Big>
        <div className="bento-chips mt-auto">{([['Priority Review', 'Priority'], ['Review Needed', 'Review'], ['Routine', 'Routine']] as const).map(([p, l]) => <button type="button" key={p} onClick={() => onPriority(p)}>{l} · {m.pending.filter(c => c.priority === p).length}</button>)}</div></Shell>;
      case 'plans': return <Shell title="Care Plans" meta={<ClipboardList className="size-4" />}>
        <div className="bento-list">{data.babies.slice(0, 3).map(b => { const p = b.plan as unknown as CarePlan; return <div className="bento-item" key={b.id}><div className="bento-item-body"><div className="bento-item-top"><strong>{b.baby_name}</strong><span className="bento-pill">Day {p.dob ? babyDay(p.dob) : '—'}</span></div></div></div>; })}
          {!data.babies.length && <p className="home-empty">No Care Plans yet.</p>}</div>
        <button type="button" className="bento-cta mt-auto" onClick={() => go('care-plan')}><ClipboardList />Create Care Plan<ArrowRight /></button></Shell>;
      case 'offline': return <Shell title="In-person visits" meta={<Link onClick={() => go('milan')} />}>
        <div className="bento-list">{offline.length ? offline.slice(0, 3).map(a => apptRow(a, false)) : <p className="home-empty">No upcoming in-person visits.</p>}
          {m.upcoming.some(a => a.status === 'Reschedule requested') && <p className="bento-sub"><Clock className="inline size-3" /> {m.upcoming.filter(a => a.status === 'Reschedule requested').length} reschedule request(s) waiting</p>}</div></Shell>;
      case 'online': return <Shell title="Video consultations" meta={<Link onClick={() => go('milan')} />}>
        <div className="bento-list">{video.length ? video.slice(0, 3).map(a => apptRow(a, true)) : <p className="home-empty">No upcoming video consultations.</p>}</div></Shell>;
      case 'lekha': return <Shell title="Lekha backlog" meta={<span>{m.backlog.length} awaiting documentation</span>}>
        <div className="bento-list two">{m.backlog.length ? m.backlog.slice(0, 4).map(a => <button type="button" className="bento-item" key={a.id} onClick={() => go('lekha')}><span className="bento-icon"><FileText /></span><div className="bento-item-body"><strong>{m.name(a.baby_id)} · {a.reason}</strong><small>{fmtFull(a.starts_at)}</small></div><span className="bento-cta sm">Document</span></button>) : <p className="home-empty">Every completed visit is documented.</p>}</div></Shell>;
      case 'taal': return <Shell title="Taal roster" meta={<Link onClick={() => go('taal')}>Open Taal</Link>}>
        <div className="bento-list two">{rows.filter(r => r.status === 'Unresponsive' || r.status === 'Overdue').slice(0, 4).map(r => { const d = r.mobile.replace(/\D/g, ''); const n = d.length === 10 ? '91' + d : d; return <article className="bento-item" key={r.id}>
          <span className={`bento-icon tone-${r.status === 'Unresponsive' ? 'err' : 'warn'}`}><Activity /></span>
          <div className="bento-item-body"><div className="bento-item-top"><strong>{r.baby}</strong><span className="bento-pill">{r.status}</span></div><small>{r.reason}</small>
            {n && <div className="bento-actions"><a className="bento-cta sm ghost" href={`https://wa.me/${n}`} target="_blank" rel="noreferrer"><MessageCircle />WhatsApp</a><a className="bento-cta sm ghost" href={`tel:+${n}`}><Phone />Call</a></div>}</div></article>; })}
          {!rows.some(r => r.status === 'Unresponsive' || r.status === 'Overdue') && <p className="home-empty">{taal.isLoading ? 'Loading cadence…' : 'No caregivers need outreach right now.'}</p>}</div></Shell>;
      case 'sutra': return <Shell title="Ask Sutra" meta={<GitBranch className="size-4" />}>
        <select className="bento-select" aria-label="Select a baby" value={askBaby} onChange={e => setAskBaby(e.target.value)}><option value="">Select a baby…</option>{data.babies.map(b => <option key={b.id} value={b.id}>{b.baby_name} · {b.caregiver_name}</option>)}</select>
        <form className="bento-ask" onSubmit={e => { e.preventDefault(); ask(q); }}><input aria-label="Ask about the care journey" disabled={!askBaby} placeholder={askBaby ? 'Ask about this baby’s journey…' : 'Please select a baby to continue'} value={q} onChange={e => setQ(e.target.value)} /><button type="submit" disabled={!askBaby} aria-label="Ask Sutra"><ArrowRight /></button></form>
        <div className="bento-chips mt-auto">{SUGGESTIONS.map(s => <button type="button" disabled={!askBaby} key={s} onClick={() => ask(s)}>{s}</button>)}</div></Shell>;
      default: return null;
    }
  };

  return <div className="caregiver-bento">
    <p className="bento-hint"><CalendarDays />Drag cards to arrange your home screen.</p>
    {layout && <DraggableWidgetGrid items={layout} maxColumns={4} cellSize={260} gap={14} radius={22} onChange={next => localStorage.setItem(LAYOUT_KEY, JSON.stringify(next.map(w => w.id)))} renderItem={render} />}
  </div>;
}
