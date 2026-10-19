import { Fragment, useEffect, useMemo, useState, type ReactNode } from 'react';
import { useServerFn } from '@tanstack/react-start';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { ArrowRight, CalendarDays, Check, FileText, GitBranch, MessageCircleHeart, Video, Activity, GripVertical } from 'lucide-react';
import DraggableWidgetGrid, { type WidgetItem } from '@/components/ui/draggable-widget-grid';
import { getCareData, getOnlineAppointments, updateAppointment } from '@/lib/care.functions';
import { nextCheckin, type CarePlan } from '@/lib/care-domain';
import { OnlineMeeting } from './online-meeting';

type Data = Awaited<ReturnType<typeof getCareData>>;
type Baby = Data['babies'][number];
type Go = (s: 'svara' | 'milan' | 'sutra') => unknown;

const LAYOUT_KEY = 'nayuva-caregiver-home-layout-v1';
const DEFAULT_LAYOUT: WidgetItem[] = [
  { id: 'activity', size: 'wide', label: 'Activity calendar' },
  { id: 'svara', size: 'sm', label: 'Svara check-in' },
  { id: 'health', size: 'sm', label: 'Check-in health' },
  { id: 'appointments', size: 'lg', label: 'Appointments' },
  { id: 'updates', size: 'lg', label: 'Recent updates' },
  { id: 'sutra', size: 'wide', label: 'Ask Sutra' },
  { id: 'notes', size: 'wide', label: 'Appointment notes' },
];
const SUGGESTIONS = ['How has feeding been this week?', 'What did the care team say last time?', 'Any concerns in my recent check-ins?'];
const tz = 'Asia/Kolkata';
const dayKey = (d: Date) => d.toLocaleDateString('en-CA', { timeZone: tz });
const fmtDay = (v: string) => new Date(v).toLocaleDateString('en-IN', { day: '2-digit', timeZone: tz });
const fmtMon = (v: string) => new Date(v).toLocaleDateString('en-IN', { month: 'short', timeZone: tz });
const fmtTime = (v: string) => new Date(v).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit', timeZone: tz });
const fmtFull = (v: string) => new Date(v).toLocaleString('en-IN', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit', timeZone: tz });
function ago(v: string) {
  const m = Math.round((Date.now() - new Date(v).getTime()) / 60000);
  if (m < 60) return `${Math.max(m, 1)}m ago`;
  const h = Math.round(m / 60); if (h < 24) return `${h}h ago`;
  const d = Math.round(h / 24); return d === 1 ? 'Yesterday' : `${d} days ago`;
}

function Shell({ title, meta, children }: { title: string; meta?: ReactNode; children: ReactNode }) {
  return <section className="bento-shell">
    <header><h3><GripVertical aria-hidden className="bento-grip" />{title}</h3>{meta && <span className="bento-meta">{meta}</span>}</header>
    <div className="bento-body">{children}</div>
  </section>;
}
function Big({ children, unit }: { children: ReactNode; unit?: string }) {
  return <p className="bento-big">{children}{unit && <span>{'\u00a0'}{unit}</span>}</p>;
}
function Dot({ tone, pulse }: { tone: 'ok' | 'warn' | 'err' | 'brand'; pulse?: boolean }) {
  return <span className={`bento-dot tone-${tone} ${pulse ? 'pulse' : ''}`} aria-hidden />;
}

export function CaregiverHome({ data, baby, go }: { data: Data; baby?: Baby | undefined; go: Go }) {
  const change = useServerFn(updateAppointment); const getOnline = useServerFn(getOnlineAppointments);
  const online = useQuery({ queryKey: ['online-appointments', 'caregiver'], queryFn: getOnline });
  const queryClient = useQueryClient();
  const [q, setQ] = useState(''); const [busyId, setBusyId] = useState(''); const [meeting, setMeeting] = useState('');
  const [layout, setLayout] = useState<WidgetItem[] | null>(null);
  useEffect(() => {
    try { const saved = JSON.parse(localStorage.getItem(LAYOUT_KEY) ?? 'null') as string[] | null;
      if (saved && saved.length === DEFAULT_LAYOUT.length && DEFAULT_LAYOUT.every(w => saved.includes(w.id))) { setLayout(saved.map(id => DEFAULT_LAYOUT.find(w => w.id === id)!)); return; }
    } catch { /* ignore corrupt layout */ }
    setLayout(DEFAULT_LAYOUT);
  }, []);

  const model = useMemo(() => {
    if (!baby) return null;
    const cards = data.cards.filter(c => c.baby_id === baby.id);
    const appts = data.appointments.filter(a => a.baby_id === baby.id);
    const plan = baby.plan as unknown as CarePlan;
    const slot = nextCheckin(plan, baby.created_at, cards[0]?.created_at);
    const upcoming = appts.filter(a => !['Completed', 'Cancelled'].includes(a.status) && new Date(a.starts_at).getTime() >= Date.now()).sort((a, b) => a.starts_at.localeCompare(b.starts_at));
    const past = appts.filter(a => a.status === 'Completed').sort((a, b) => b.starts_at.localeCompare(a.starts_at));
    return { cards, appts, plan, slot, upcoming, past };
  }, [data, baby]);

  if (!baby || !model) return <p className="home-empty">No care profile is connected yet.</p>;
  if (meeting) return <OnlineMeeting id={meeting} onClose={() => setMeeting('')} />;
  const { cards, appts, plan, slot, upcoming, past } = model;
  const onlineIds = new Map((online.data ?? []).map(o => [o.appointment_id, o.status]));
  const ask = (text: string) => { if (text.trim()) sessionStorage.setItem('sutra-initial-query', text.trim()); void go('sutra'); };
  const confirm = async (id: string) => { setBusyId(id); try { await change({ data: { id, status: 'Confirmed' } }); void queryClient.invalidateQueries({ queryKey: ['care-data'] }); } finally { setBusyId(''); } };

  // Activity matrix: last 5 weeks × 7 days, each day a square tile.
  const checkinDays = new Map<string, number>();
  cards.forEach(c => { const k = dayKey(new Date(c.created_at)); checkinDays.set(k, (checkinDays.get(k) ?? 0) + 1); });
  const apptDays = new Set(appts.map(a => dayKey(new Date(a.starts_at))));
  const today = new Date(); const todayKey = dayKey(today);
  const WEEKS = 18; const DAY_LABELS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
  const dow = (today.getDay() + 6) % 7; // Monday = 0
  const start = new Date(today); start.setDate(today.getDate() - dow - (WEEKS - 1) * 7);
  const matrix = DAY_LABELS.map((_, d) => Array.from({ length: WEEKS }, (_, w) => { const dt = new Date(start); dt.setDate(start.getDate() + w * 7 + d); return dt; }));
  const last14 = cards.filter(c => Date.now() - new Date(c.created_at).getTime() < 14 * 86400000).length;
  const total = cards.length;
  const pct = (p: string) => total ? Math.round(cards.filter(c => c.priority === p).length / total * 100) : 0;
  const recent = cards.slice(0, 4);

  const render = (item: WidgetItem) => {
    switch (item.id) {
      case 'activity': return <Shell title="Activity calendar" meta={<span>Last 4 months</span>}>
        <Big unit="check-ins · 14 days">{last14}</Big>
        <div className="bento-matrix" role="img" aria-label={`${total} check-ins and ${appts.length} appointments recorded.`}>
          <span />{matrix[0]!.map((dt, w) => <span key={w} className="bento-axis">{w % 4 ? "" : dt.toLocaleDateString('en-IN', { day: '2-digit', month: 'short', timeZone: tz })}</span>)}
          {matrix.map((row, d) => <Fragment key={d}><span className="bento-axis">{DAY_LABELS[d]}</span>{row.map((dt, w) => {
            const k = dayKey(dt); const n = checkinDays.get(k) ?? 0; const a = apptDays.has(k); const future = dt > today && k !== todayKey;
            const cls = future ? 'future' : n && a ? 'both' : a ? 'appt' : n >= 2 ? 'heat-2' : n ? 'heat-1' : '';
            return <span key={w} title={`${dt.toLocaleDateString('en-IN', { day: 'numeric', month: 'short', timeZone: tz })} · ${n} check-in${n === 1 ? '' : 's'}${a ? ' · appointment' : ''}`} className={`bento-tile ${cls} ${k === todayKey ? 'today' : ''}`} />;
          })}</Fragment>)}
        </div>
        <div className="bento-legend"><span><i className="bento-tile heat-1" />Check-in</span><span><i className="bento-tile heat-2" />2+ check-ins</span><span><i className="bento-tile appt" />Appointment</span><span><i className="bento-tile both" />Both</span></div>
      </Shell>;
      case 'svara': return <Shell title="Svara check-in" meta={<span className="bento-live"><Dot tone={slot.due ? 'brand' : 'ok'} pulse />{slot.due ? 'Due now' : 'Up to date'}</span>}>
        <Big>{fmtTime(slot.scheduledFor)}</Big>
        <p className="bento-sub">{slot.due ? 'Your check-in is due' : 'Next check-in'} · {plan.frequency}</p>
        <button type="button" className="bento-cta mt-auto" onClick={() => go('svara')}><MessageCircleHeart />Talk to Svara<ArrowRight /></button>
      </Shell>;
      case 'health': return <Shell title="Check-in health" meta="All time">
        <Big unit="updates">{total}</Big>
        <dl className="bento-rows mt-auto">{([['Routine', 'Routine', 'ok'], ['Review needed', 'Review Needed', 'warn'], ['Priority review', 'Priority Review', 'err']] as const).map(([l, p, t]) => <div key={p}><dt><Dot tone={t} />{l}</dt><dd>{pct(p)}%</dd><span className="bento-bar"><i className={`tone-${t}`} style={{ width: `${pct(p)}%` }} /></span></div>)}</dl>
      </Shell>;
      case 'appointments': return <Shell title="Appointments" meta={<button type="button" className="bento-link" onClick={() => go('milan')}>View all<ArrowRight /></button>}>
        <div className="bento-list">
          <p className="bento-group">Upcoming</p>
          {upcoming.length ? upcoming.slice(0, 2).map(a => { const isOnline = onlineIds.has(a.id); const ready = onlineIds.get(a.id) === 'ready'; return <article className="bento-item" key={a.id}>
            <div className="bento-date"><strong>{fmtDay(a.starts_at)}</strong><span>{fmtMon(a.starts_at)}</span></div>
            <div className="bento-item-body"><div className="bento-item-top"><strong>{a.reason}</strong><span className={`bento-pill ${a.status === 'Confirmed' ? 'ok' : ''}`}>{a.status}</span></div>
              <small>{fmtTime(a.starts_at)} · {isOnline ? 'Online video' : (a.location as Record<string, string>)['facilityName'] || 'In person'}</small>
              <div className="bento-actions">{a.status !== 'Confirmed' && <button type="button" className="bento-cta sm" disabled={busyId === a.id} onClick={() => void confirm(a.id)}><Check />Confirm availability</button>}{isOnline && <button type="button" className="bento-cta sm ghost" disabled={!ready} onClick={() => setMeeting(a.id)}><Video />Join online</button>}</div>
            </div></article>; }) : <p className="home-empty">No upcoming appointments.</p>}
          <p className="bento-group">Recent</p>
          {past.length ? past.slice(0, 3).map(a => <article className="bento-item" key={a.id}>
            <div className="bento-date muted"><strong>{fmtDay(a.starts_at)}</strong><span>{fmtMon(a.starts_at)}</span></div>
            <div className="bento-item-body"><div className="bento-item-top"><strong>{a.reason}</strong><span className="bento-pill ok">Completed</span></div><small>{fmtTime(a.starts_at)} · {data.notes.some(n => n.appointment_id === a.id) ? 'Notes available' : 'Notes pending'}</small></div></article>) : <p className="home-empty">No completed appointments yet.</p>}
        </div>
      </Shell>;
      case 'updates': return <Shell title="Recent updates" meta={<span className="bento-live"><Dot tone="ok" pulse />Live</span>}>
        <div className="bento-list">{recent.length ? recent.map(c => <article className="bento-item" key={c.id}>
          <span className={`bento-icon tone-${c.priority === 'Priority Review' ? 'err' : c.priority === 'Review Needed' ? 'warn' : 'ok'}`}><Activity /></span>
          <div className="bento-item-body"><div className="bento-item-top"><strong>{c.category}</strong><span className={`bento-pill ${c.reviewed ? 'ok' : ''}`}>{c.reviewed ? 'Reviewed' : 'Awaiting review'}</span></div>
            <small>{ago(c.created_at)} · {fmtFull(c.created_at)} · {c.priority === 'Priority Review' ? 'Priority' : c.priority === 'Review Needed' ? 'Review' : 'Routine'}</small></div>
        </article>) : <p className="home-empty">No submitted updates yet.</p>}</div>
      </Shell>;
      case 'sutra': return <Shell title="Ask Sutra" meta={<GitBranch className="size-4" />}>
        <p className="bento-sub">Look back at {baby.baby_name}’s care journey.</p>
        <form className="bento-ask" onSubmit={e => { e.preventDefault(); ask(q); }}><input aria-label="Ask about the care journey" placeholder="Ask about the care journey…" value={q} onChange={e => setQ(e.target.value)} /><button type="submit" aria-label="Ask Sutra"><ArrowRight /></button></form>
        <div className="bento-chips mt-auto">{SUGGESTIONS.map(s => <button type="button" key={s} onClick={() => ask(s)}>{s}</button>)}</div>
      </Shell>;
      case 'notes': return <Shell title="Appointment notes" meta={<span>{past.length} completed</span>}>
        <div className="bento-list two">{past.length ? past.slice(0, 4).map(a => <button type="button" className="bento-item" key={a.id} onClick={() => go('sutra')}><span className="bento-icon"><FileText /></span><div className="bento-item-body"><strong>{a.reason}</strong><small>{fmtFull(a.starts_at)}</small></div><ArrowRight className="size-4 opacity-60" /></button>) : <p className="home-empty">Notes appear here after completed appointments.</p>}</div>
      </Shell>;
      default: return null;
    }
  };

  return <div className="caregiver-bento">
    <p className="bento-hint"><CalendarDays />Drag cards to arrange your home screen.</p>
    {layout && <DraggableWidgetGrid items={layout} maxColumns={4} cellSize={260} gap={14} radius={22} onChange={next => localStorage.setItem(LAYOUT_KEY, JSON.stringify(next.map(w => w.id)))} renderItem={render} />}
  </div>;
}
