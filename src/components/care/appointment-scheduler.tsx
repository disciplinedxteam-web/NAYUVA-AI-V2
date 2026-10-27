import { useMemo, useState } from 'react';
import { useServerFn } from '@tanstack/react-start';
import { ArrowLeft, ArrowRight, CalendarDays, Check, ChevronLeft, ChevronRight, FileText, Search, User } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { GlassToggle } from '@/components/ui/glass-toggle';
import { useLanguage } from '@/components/language-provider';
import { createAppointment, getCareData } from '@/lib/care.functions';
import { reasons } from '@/lib/care-domain';
import { CareTicket } from './care-ticket';
type Data = Awaited<ReturnType<typeof getCareData>>;
type Run = (action: () => Promise<unknown>, message: string) => Promise<void>;
export function ProfileSearch({ babies, value, onSelect }: { babies: Data['babies']; value: string; onSelect: (id: string) => void }) {
  const [search, setSearch] = useState(''); const [open, setOpen] = useState(false); const [focusNext, setFocusNext] = useState(false);
  const selected = babies.find(b => b.id === value);
  const matches = search.trim() ? babies.filter(b => (b.baby_name + ' ' + b.caregiver_name).toLowerCase().includes(search.toLowerCase())).slice(0, 8) : [];
  if (selected) return <div className="profile-search"><div className="profile-pill" role="group" aria-label="Selected profile">
    <span className="profile-pill-avatar"><User size={15} aria-hidden="true" /></span>
    <span className="profile-pill-text"><strong>{selected.baby_name}</strong><small>{selected.caregiver_name}</small></span>
    <button type="button" className="profile-pill-clear" aria-label="Change profile" onClick={() => { onSelect(''); setSearch(''); setFocusNext(true); setOpen(true); }}><X size={14} /></button>
  </div></div>;
  return <div className="profile-search"><div className="search-field"><Search size={16} /><input className="ws-input" autoFocus={focusNext} aria-label="Search baby or caregiver" placeholder="Search baby or caregiver" value={search} onFocus={() => setOpen(true)} onChange={e => { setSearch(e.target.value); setOpen(true); }} /></div>
    {open && search.trim() && <div className="profile-results">{matches.map(b => <Button variant="ghost" type="button" key={b.id} onClick={() => { onSelect(b.id); setSearch(''); setOpen(false); }}><User size={16} /><span><strong>{b.baby_name}</strong><small>{b.caregiver_name}</small></span></Button>)}{!matches.length && <p>No matching profiles.</p>}</div>}
  </div>;
}
export function Scheduler({ data, busy, run, onDone, initialBabyId = '' }: { data: Data; busy: boolean; run: Run; onDone: () => void; initialBabyId?: string }) {
  const {language}=useLanguage();
  const create = useServerFn(createAppointment); const settings = data.settings as Record<string, string>;
  const today = new Date(); today.setHours(0, 0, 0, 0);
  const [month, setMonth] = useState(new Date(today.getFullYear(), today.getMonth(), 1));
  const [babyId, setBabyId] = useState(initialBabyId); const [reason, setReason] = useState(reasons[0] ?? '');
  const [date, setDate] = useState<Date | null>(null); const [time, setTime] = useState(''); const [endTime, setEndTime] = useState('');
  const [mode,setMode]=useState('offline');
  const [mapsLink, setMapsLink] = useState(settings['mapsLink'] ?? ''); const [editPlace, setEditPlace] = useState(false);
  const baby = data.babies.find(b => b.id === babyId);
  const days = useMemo(() => { const first = month.getDay(); const n = new Date(month.getFullYear(), month.getMonth() + 1, 0).getDate(); return [...Array<null>(first).fill(null), ...Array.from({ length: n }, (_, i) => new Date(month.getFullYear(), month.getMonth(), i + 1))]; }, [month]);
  const iso = (d: Date) => `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
  const [confirming, setConfirming] = useState(false); const [stamped, setStamped] = useState(false);
  if (confirming && baby && date) return <div className="scheduler-confirm">
    <h2 className="svara-title">Confirm this appointment</h2>
    <CareTicket source="Milan" title={baby.baby_name} subtitle={reason} date={date.toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })} stamp={stamped ? 'Approved' : null} stubLabel="Care team" fields={[{ label: 'Caregiver', value: baby.caregiver_name }, { label: 'Date', value: date.toLocaleDateString('en-IN', { weekday: 'short', day: 'numeric', month: 'short' }) }, { label: 'Time', value: `${time} – ${endTime} IST` }, { label: 'Reason', value: reason }, { label: 'Mode', value: mode==='online'?'Online video':'In-person' }, { label: 'Location', value: mode==='online'?'Private Nayuva consultation':settings['facilityName'] || 'Not configured' }, { label: 'Status', value: 'Scheduled' }]} action={{ label: 'Approve', disabled: busy, onClick: () => { setStamped(true); window.setTimeout(() => { void run(async () => { await create({ data: { babyId: baby.id, date: iso(date), time, endTime, mode:mode as 'offline'|'online', reason, location: { facilityName: settings['facilityName'] ?? '', address: settings['address'] ?? '', mapsLink } } }); onDone(); }, 'Appointment scheduled and shared with the caregiver.');  }, 900); } }} />
    <Button type="button" variant="ghost" disabled={stamped} onClick={() => setConfirming(false)}><ArrowLeft />Edit details</Button>
  </div>;
  return <form className="ws-split scheduler-compact" onSubmit={e => { e.preventDefault(); if (!baby || !date || !time || !endTime || endTime <= time) return; setStamped(false); setConfirming(true); }}>
    <section className="ws-panel">
      <div className="ws-panel-title"><CalendarDays /><div>Date & time<small>India Standard Time</small></div></div>
      <div className="cal-head"><Button type="button" variant="ghost" size="icon" aria-label="Previous month" disabled={month <= new Date(today.getFullYear(), today.getMonth(), 1)} onClick={() => setMonth(new Date(month.getFullYear(), month.getMonth() - 1, 1))}><ChevronLeft /></Button><strong>{month.toLocaleDateString(`${language}-IN`, { month: 'long', year: 'numeric' })}</strong><Button type="button" variant="ghost" size="icon" aria-label="Next month" onClick={() => setMonth(new Date(month.getFullYear(), month.getMonth() + 1, 1))}><ChevronRight /></Button></div>
      <div className="cal-grid">{['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(d => <span key={d}>{d}</span>)}{days.map((d, i) => d ? <Button variant="ghost" type="button" key={i} disabled={d < today} aria-label={iso(d)} aria-pressed={!!date && d.getTime() === date.getTime()} onClick={() => setDate(d)}>{d.getDate()}</Button> : <i key={i} />)}</div>
      <div className="time-fields"><label><span className="ws-label">Start time</span><input className="ws-input" type="time" required value={time} onChange={e => setTime(e.target.value)} /></label><label><span className="ws-label">End time</span><input className="ws-input" type="time" required min={time} value={endTime} onChange={e => setEndTime(e.target.value)} /></label></div>
      {endTime && time && endTime <= time && <p role="alert" className="text-destructive text-sm">End time must be after start time.</p>}
    </section>
    <section className="ws-panel">
      <div className="ws-panel-title"><FileText /><div>Appointment details</div></div>
      <div><span className="ws-label">Appointment mode</span><GlassToggle value={mode} onChange={setMode} options={[{key:'offline',label:'In-person'},{key:'online',label:'Online video'}]}/></div>
      <div><span className="ws-label">Care Plan profile</span><ProfileSearch babies={data.babies} value={babyId} onSelect={setBabyId} /></div>
      <label><span className="ws-label">Appointment reason</span><select className="ws-input" value={reason} onChange={e => setReason(e.target.value)}>{reasons.map(r => <option key={r} value={r}>{r}</option>)}</select></label>
      {mode==='offline'&&<div><div className="flex items-center justify-between"><span className="ws-label">Appointment location</span><Button type="button" variant="ghost" size="sm" onClick={() => setEditPlace(v => !v)}>{editPlace ? 'Done' : 'Change'}</Button></div>{editPlace ? <label><span className="ws-label">Google Maps link</span><input type="url" className="ws-input" placeholder="https://maps.google.com/…" value={mapsLink} onChange={e => setMapsLink(e.target.value)} /></label> : <p className="nv-sub">{settings['facilityName'] || 'Location not configured'}{mapsLink && <><br /><a href={mapsLink} target="_blank" rel="noreferrer">View location</a></>}</p>}</div>}
      {mode==='online'&&<p className="nv-sub">A private online appointment will appear in both care dashboards. Both participants consent before transcription.</p>}
      <p className="scheduler-summary">{date ? date.toLocaleDateString('en-IN', { day: 'numeric', month: 'long', year: 'numeric' }) : 'Choose an appointment date'}{time && ` · ${time}`}{endTime && ` – ${endTime} IST`}</p>
      <div className="flex gap-2 mt-auto"><Button type="button" variant="ghost" onClick={onDone}><ArrowLeft />Back</Button><Button type="submit" className="flex-1" disabled={busy || !baby || !date || !time || !endTime || endTime <= time}>Schedule appointment<ArrowRight /></Button></div>
    </section>
  </form>;
}

