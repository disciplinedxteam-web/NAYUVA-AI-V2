import { useEffect, useMemo, useRef, useState } from 'react';
import { useServerFn } from '@tanstack/react-start';
import { ArrowLeft, ArrowRight, CalendarDays, Check, ChevronLeft, ChevronRight, Clock, FileText, HeartPulse, MapPin, Mic, Paperclip, Plus, Search, Send, Sparkles, Square, Stethoscope, User, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { WorkspaceHeading } from './workspace-heading';
import { askSutra, createAppointment, getCareData, saveClinicalNote, updateAppointment } from '@/lib/care.functions';
import { reasons, type DemoRole } from '@/lib/care-domain';
import { detectChecklist, lekhaChecklist } from '@/lib/lekha-checklist';

type Data = Awaited<ReturnType<typeof getCareData>>;
type Appointment = Data['appointments'][number];
type Run = (action: () => Promise<unknown>, message: string) => Promise<void>;
const closed = ['Completed', 'Cancelled'];
const tz = { timeZone: 'Asia/Kolkata' } as const;
const fmtDay = (v: string) => new Date(v).toLocaleDateString('en-IN', { weekday: 'short', day: 'numeric', month: 'short', year: 'numeric', ...tz });
const fmtTime = (v: string) => new Date(v).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit', ...tz });
const fmt = (v: string) => `${fmtDay(v)} · ${fmtTime(v)}`;
const loc = (a: Appointment) => (a.location ?? {}) as Record<string, string>;

export function Toggle({ options, value, onChange }: { options: { key: string; label: string; count: number }[]; value: string; onChange: (k: string) => void }) {
  return <div className="ws-toggle" role="group">{options.map(o => <Button variant="ghost" key={o.key} type="button" aria-pressed={value === o.key} onClick={() => onChange(o.key)}>{o.label}<span className="count">{o.count}</span></Button>)}</div>;
}
function EmptyState({ children }: { children: React.ReactNode }) { return <div className="care-empty"><p>{children}</p></div>; }

/* Speech capture shared by Lekha and Sutra */
type Rec = { lang: string; continuous: boolean; interimResults: boolean; onresult: ((e: { results: ArrayLike<{ 0: { transcript: string } }> }) => void) | null; onend: (() => void) | null; onerror: (() => void) | null; start: () => void; stop: () => void };
function useSpeech(onText: (t: string) => void) {
  const [listening, setListening] = useState(false); const [error, setError] = useState(''); const rec = useRef<Rec | null>(null);
  useEffect(() => () => rec.current?.stop(), []);
  function toggle() {
    if (listening) { rec.current?.stop(); setListening(false); return; }
    const w = window as unknown as { SpeechRecognition?: new () => Rec; webkitSpeechRecognition?: new () => Rec };
    const C = w.SpeechRecognition ?? w.webkitSpeechRecognition; if (!C) { setError('Voice input is unavailable in this browser — please type.'); return; }
    const r = new C(); r.lang = 'en-IN'; r.continuous = true; r.interimResults = true;
    r.onresult = e => { let t = ''; for (let i = 0; i < e.results.length; i++) t += (e.results[i]?.[0].transcript ?? '') + ' '; onText(t.trim()); };
    r.onend = () => setListening(false); r.onerror = () => { setListening(false); setError('Microphone access failed — please type.'); };
    rec.current = r; try { r.start(); setListening(true); setError(''); } catch { setError('Voice input unavailable — please type.'); }
  }
  return { listening, error, toggle };
}

/* ---------------- Milan ---------------- */
export function MilanWorkspace({ data, role, busy, run, onDocument }: { data: Data; role: DemoRole; busy: boolean; run: Run; onDocument: () => void }) {
  const change = useServerFn(updateAppointment);
  const [tab, setTab] = useState('upcoming'); const [scheduling, setScheduling] = useState(false); const [request, setRequest] = useState<string | null>(null); const [rDate, setRDate] = useState(''); const [rTime, setRTime] = useState('');
  const isPast = (a: Appointment) => closed.includes(a.status) || new Date(a.starts_at).getTime() < Date.now();
  const upcoming = data.appointments.filter(a => !isPast(a)).sort((a, b) => a.starts_at.localeCompare(b.starts_at));
  const past = data.appointments.filter(isPast).sort((a, b) => b.starts_at.localeCompare(a.starts_at));
  const list = tab === 'upcoming' ? upcoming : past;
  const babyOf = (id: string) => data.babies.find(b => b.id === id);
  return <>
    <WorkspaceHeading title="Milan" description="Appointments and coordinated follow-up care." />
    {scheduling ? <Scheduler data={data} busy={busy} run={run} onDone={() => setScheduling(false)} /> : <>
      <div className="ws-bar">
        <Toggle value={tab} onChange={setTab} options={[{ key: 'upcoming', label: 'Upcoming', count: upcoming.length }, { key: 'past', label: 'Past', count: past.length }]} />
        {role === 'care-team' && <Button onClick={() => setScheduling(true)} disabled={!data.babies.length}><Plus />Schedule Appointment</Button>}
      </div>
      {!list.length ? <EmptyState>{tab === 'upcoming' ? 'No upcoming appointments.' : 'No past appointments yet.'}</EmptyState> :
        <div className="ws-grid">{list.map(a => {
          const b = babyOf(a.baby_id); const l = loc(a); const resched = a.reschedule as { date: string; time: string } | null;
          const documented = data.notes.some(n => (n as { appointment_id?: string }).appointment_id === a.id);
          return <article key={a.id} className="nv-card">
            <div className="nv-card-top"><span className="nv-tag"><CalendarDays />Appointment</span><span className={`nv-pill ${a.status === 'Confirmed' || a.status === 'Completed' ? 'ok' : ''}`}>{a.status}</span></div>
            <h3>{a.reason}</h3>
            <div className="nv-row"><CalendarDays /><div><strong>{fmtDay(a.starts_at)}</strong><small>{fmtTime(a.starts_at)}{a.ends_at ? ` – ${fmtTime(a.ends_at)}` : ''} IST</small></div></div>
            <div className="nv-row"><User /><div><strong>{b?.baby_name ?? 'Baby'}</strong><small>Caregiver · {b?.caregiver_name ?? '—'}</small></div></div>
            <div className="nv-row"><MapPin /><div><strong>{l['facilityName'] || 'Location not set'}</strong><small>{l['address'] || 'Add an address in Settings'}</small></div></div>
            {resched && a.status === 'Reschedule requested' && <p className="nv-sub">Requested: {resched.date} at {resched.time}</p>}
            {request === a.id ? <form className="nv-card-actions" onSubmit={e => { e.preventDefault(); void run(async () => { await change({ data: { id: a.id, status: 'Reschedule requested', preferredDate: rDate, preferredTime: rTime } }); setRequest(null); }, 'Reschedule request sent. Your original appointment time has not changed.'); }}>
              <input className="ws-input" type="date" required value={rDate} onChange={e => setRDate(e.target.value)} aria-label="Preferred date" />
              <input className="ws-input" type="time" required value={rTime} onChange={e => setRTime(e.target.value)} aria-label="Preferred time" />
              <Button type="submit" disabled={busy}>Send</Button><Button type="button" variant="ghost" onClick={() => setRequest(null)}>Cancel</Button>
            </form> : <div className="nv-card-actions">
              {!isPast(a) && role === 'caregiver' && <><Button disabled={busy || a.status === 'Confirmed'} onClick={() => void run(() => change({ data: { id: a.id, status: 'Confirmed' } }), 'Appointment confirmed.')}>Confirm</Button><Button variant="outline" onClick={() => setRequest(a.id)}>Reschedule</Button></>}
              {!isPast(a) && role === 'care-team' && <><Button disabled={busy} onClick={() => void run(() => change({ data: { id: a.id, status: 'Completed' } }), 'Marked as done. It is now waiting in Lekha.')}><Check />Mark done</Button><Button variant="ghost" disabled={busy} onClick={() => void run(() => change({ data: { id: a.id, status: 'Cancelled' } }), 'Appointment cancelled.')}>Cancel</Button></>}
              {role === 'care-team' && a.status === 'Completed' && <Button variant="outline" onClick={onDocument}><FileText />{documented ? 'View in Lekha' : 'Document in Lekha'}</Button>}
              {l['mapsLink']?.startsWith('https://') && <Button asChild variant="ghost"><a href={l['mapsLink']} target="_blank" rel="noreferrer"><MapPin />Map</a></Button>}
            </div>}
          </article>;
        })}</div>}
    </>}
  </>;
}

export function ProfileSearch({ babies, value, onSelect }: { babies: Data['babies']; value: string; onSelect: (id: string) => void }) {
  const [search, setSearch] = useState(''); const [open, setOpen] = useState(false);
  const selected = babies.find(b => b.id === value);
  const matches = search.trim() ? babies.filter(b => (b.baby_name + ' ' + b.caregiver_name).toLowerCase().includes(search.toLowerCase())).slice(0, 8) : [];
  return <div className="profile-search"><div className="search-field"><Search size={16} /><input className="ws-input" aria-label="Search baby or caregiver" placeholder={selected ? `${selected.baby_name} · ${selected.caregiver_name}` : 'Search baby or caregiver'} value={search} onFocus={() => setOpen(true)} onChange={e => { setSearch(e.target.value); setOpen(true); }} /></div>
    {open && search.trim() && <div className="profile-results">{matches.map(b => <Button variant="ghost" type="button" key={b.id} onClick={() => { onSelect(b.id); setSearch(''); setOpen(false); }}><User size={16} /><span><strong>{b.baby_name}</strong><small>{b.caregiver_name}</small></span>{b.id === value && <Check size={16} />}</Button>)}{!matches.length && <p>No matching profiles.</p>}</div>}
    {selected && <div className="profile-selected"><Check size={14} /><span>{selected.baby_name} · {selected.caregiver_name}</span></div>}
  </div>;
}
function Scheduler({ data, busy, run, onDone }: { data: Data; busy: boolean; run: Run; onDone: () => void }) {
  const create = useServerFn(createAppointment); const settings = data.settings as Record<string, string>;
  const today = new Date(); today.setHours(0, 0, 0, 0);
  const [month, setMonth] = useState(new Date(today.getFullYear(), today.getMonth(), 1));
  const [babyId, setBabyId] = useState(''); const [reason, setReason] = useState(reasons[0] ?? '');
  const [date, setDate] = useState<Date | null>(null); const [time, setTime] = useState(''); const [endTime, setEndTime] = useState('');
  const [mapsLink, setMapsLink] = useState(settings['mapsLink'] ?? ''); const [editPlace, setEditPlace] = useState(false);
  const baby = data.babies.find(b => b.id === babyId);
  const days = useMemo(() => { const first = month.getDay(); const n = new Date(month.getFullYear(), month.getMonth() + 1, 0).getDate(); return [...Array<null>(first).fill(null), ...Array.from({ length: n }, (_, i) => new Date(month.getFullYear(), month.getMonth(), i + 1))]; }, [month]);
  const iso = (d: Date) => `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
  return <form className="ws-split scheduler-compact" onSubmit={e => { e.preventDefault(); if (!baby || !date || !time || !endTime || endTime <= time) return; void run(async () => { await create({ data: { babyId: baby.id, date: iso(date), time, endTime, reason, location: { facilityName: settings['facilityName'] ?? '', address: settings['address'] ?? '', mapsLink } } }); onDone(); }, 'Appointment scheduled and shared with the caregiver.'); }}>
    <section className="ws-panel">
      <div className="ws-panel-title"><CalendarDays /><div>Date & time<small>India Standard Time</small></div></div>
      <div className="cal-head"><Button type="button" variant="ghost" size="icon" aria-label="Previous month" disabled={month <= new Date(today.getFullYear(), today.getMonth(), 1)} onClick={() => setMonth(new Date(month.getFullYear(), month.getMonth() - 1, 1))}><ChevronLeft /></Button><strong>{month.toLocaleDateString('en-IN', { month: 'long', year: 'numeric' })}</strong><Button type="button" variant="ghost" size="icon" aria-label="Next month" onClick={() => setMonth(new Date(month.getFullYear(), month.getMonth() + 1, 1))}><ChevronRight /></Button></div>
      <div className="cal-grid">{['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(d => <span key={d}>{d}</span>)}{days.map((d, i) => d ? <Button variant="ghost" type="button" key={i} disabled={d < today} aria-label={iso(d)} aria-pressed={!!date && d.getTime() === date.getTime()} onClick={() => setDate(d)}>{d.getDate()}</Button> : <i key={i} />)}</div>
      <div className="time-fields"><label><span className="ws-label">Start time</span><input className="ws-input" type="time" required value={time} onChange={e => setTime(e.target.value)} /></label><label><span className="ws-label">End time</span><input className="ws-input" type="time" required min={time} value={endTime} onChange={e => setEndTime(e.target.value)} /></label></div>
      {endTime && time && endTime <= time && <p role="alert" className="text-destructive text-sm">End time must be after start time.</p>}
    </section>
    <section className="ws-panel">
      <div className="ws-panel-title"><FileText /><div>Appointment details</div></div>
      <div><span className="ws-label">Care Plan profile</span><ProfileSearch babies={data.babies} value={babyId} onSelect={setBabyId} /></div>
      <label><span className="ws-label">Appointment reason</span><select className="ws-input" value={reason} onChange={e => setReason(e.target.value)}>{reasons.map(r => <option key={r}>{r}</option>)}</select></label>
      <div><div className="flex items-center justify-between"><span className="ws-label">Appointment location</span><Button type="button" variant="ghost" size="sm" onClick={() => setEditPlace(v => !v)}>{editPlace ? 'Done' : 'Change'}</Button></div>{editPlace ? <label><span className="ws-label">Google Maps link</span><input type="url" className="ws-input" placeholder="https://maps.google.com/…" value={mapsLink} onChange={e => setMapsLink(e.target.value)} /></label> : <p className="nv-sub">{settings['facilityName'] || 'Location not configured'}{mapsLink && <><br /><a href={mapsLink} target="_blank" rel="noreferrer">View location</a></>}</p>}</div>
      <p className="scheduler-summary">{date ? date.toLocaleDateString('en-IN', { day: 'numeric', month: 'long', year: 'numeric' }) : 'Choose an appointment date'}{time && ` · ${time}`}{endTime && ` – ${endTime} IST`}</p>
      <div className="flex gap-2 mt-auto"><Button type="button" variant="ghost" onClick={onDone}><ArrowLeft />Back</Button><Button type="submit" className="flex-1" disabled={busy || !baby || !date || !time || !endTime || endTime <= time}>Schedule appointment<ArrowRight /></Button></div>
    </section>
  </form>;
}

/* ---------------- Lekha ---------------- */
export function LekhaWorkspace({ data, busy, run }: { data: Data; busy: boolean; run: Run }) {
  const [tab, setTab] = useState('pending'); const [openId, setOpenId] = useState<string | null>(null);
  const noteFor = (id: string) => data.notes.find(n => (n as { appointment_id?: string }).appointment_id === id) as (Data['notes'][number] & { observations: string; decision: string; follow_up: string; created_at: string }) | undefined;
  const completed = data.appointments.filter(a => a.status === 'Completed').sort((a, b) => b.starts_at.localeCompare(a.starts_at));
  const pending = completed.filter(a => !noteFor(a.id)); const done = completed.filter(a => noteFor(a.id));
  const open = completed.find(a => a.id === openId);
  if (open && !noteFor(open.id)) return <LekhaSession data={data} appt={open} busy={busy} run={run} onClose={() => setOpenId(null)} />;
  const list = tab === 'pending' ? pending : done;
  return <>
    <WorkspaceHeading title="Lekha" description="Clinician-reviewed appointment documentation." />
    <div className="ws-bar"><Toggle value={tab} onChange={setTab} options={[{ key: 'pending', label: 'Awaiting documentation', count: pending.length }, { key: 'done', label: 'Documented', count: done.length }]} /></div>
    {!list.length ? <EmptyState>{tab === 'pending' ? 'No completed appointments are waiting for documentation. Mark an appointment as done in Milan.' : 'No documented appointments yet.'}</EmptyState> :
      <div className="ws-grid">{list.map(a => { const b = data.babies.find(x => x.id === a.baby_id); const n = noteFor(a.id); return <article key={a.id} className="nv-card">
        <div className="nv-card-top"><span className="nv-tag"><HeartPulse />Appointment Health Card</span><span className={`nv-pill ${n ? 'ok' : ''}`}>{n ? 'Documented' : 'Awaiting'}</span></div>
        <h3>{a.reason}</h3><p className="nv-sub">{n ? `Documented ${fmt(n.created_at)}` : `Seen ${fmt(a.starts_at)}`}</p>
        <div className="nv-row"><User /><div><strong>{b?.baby_name}</strong><small>Caregiver · {b?.caregiver_name}</small></div></div>
        {n ? <><div className="nv-row"><Stethoscope /><div><strong>Findings</strong><small>{n.observations}</small></div></div><div className="nv-row"><Sparkles /><div><strong>Follow-up</strong><small>{n.follow_up || 'None recorded'}</small></div></div></>
          : <div className="nv-row"><MapPin /><div><strong>{loc(a)['facilityName'] || 'Location not set'}</strong><small>{loc(a)['address'] || '—'}</small></div></div>}
        <div className="nv-card-actions">{!n && <Button onClick={() => setOpenId(a.id)}><FileText />Create documentation</Button>}</div>
      </article>; })}</div>}
  </>;
}

type Msg = { role: 'user' | 'assistant'; content: string };
function LekhaSession({ data, appt, busy, run, onClose }: { data: Data; appt: Appointment; busy: boolean; run: Run; onClose: () => void }) {
  const save = useServerFn(saveClinicalNote); const baby = data.babies.find(b => b.id === appt.baby_id);
  const [msgs, setMsgs] = useState<Msg[]>([]); const [draft, setDraft] = useState(''); const [files, setFiles] = useState<File[]>([]); const [review, setReview] = useState(false);
  const [f, setF] = useState({ observations: '', decision: '', followUp: '', additionalNote: '' });
  const speech = useSpeech(setDraft); const fileRef = useRef<HTMLInputElement>(null);
  const said = msgs.filter(m => m.role === 'user').map(m => m.content).join('\n');
  const covered = detectChecklist(said + ' ' + draft, files.length);
  function send() { const t = draft.trim(); if (!t) return; if (speech.listening) speech.toggle(); const now = detectChecklist(said + ' ' + t, files.length); const missing = lekhaChecklist.filter(i => !now.has(i.key) && i.key !== 'files').slice(0, 2).map(i => i.title.toLowerCase()); setMsgs(m => [...m, { role: 'user', content: t }, { role: 'assistant', content: `Noted. ${now.size}/${lekhaChecklist.length} checklist topics covered.${missing.length ? ` If relevant, you could add ${missing.join(' and ')}.` : ' Everything is covered — prepare the card when ready.'}` }]); setDraft(''); }
  return <>
    <WorkspaceHeading title="Lekha" description="Clinician-reviewed appointment documentation." /><div className="flex items-center justify-between mb-3"><Button variant="ghost" onClick={onClose}><ArrowLeft />Appointments</Button><span className="nv-pill">{review ? 'Review' : 'In progress'}</span></div>
    <div className="lekha-compact">
      <section className="appointment-context">
        <div className="ws-panel-title"><CalendarDays /><div>Appointment details</div></div>
        <div className="nv-row"><FileText /><div><strong>{appt.reason}</strong><small>Completed</small></div></div>
        <div className="nv-row"><CalendarDays /><div><strong>{fmtDay(appt.starts_at)}</strong><small>{fmtTime(appt.starts_at)} IST</small></div></div>
        <div className="nv-row"><User /><div><strong>{baby?.baby_name}</strong><small>Caregiver · {baby?.caregiver_name}</small></div></div>
        <div className="nv-row"><MapPin /><div><strong>{loc(appt)['facilityName'] || 'Location not set'}</strong><small>{loc(appt)['address'] || '—'}</small></div></div>
        <div className="ws-panel-title mt-2"><Paperclip /><div>Reports & files<small>Names are noted on the card</small></div></div>
        <input ref={fileRef} type="file" multiple hidden accept=".pdf,.jpg,.jpeg,.png" onChange={e => setFiles(x => [...x, ...Array.from(e.target.files ?? [])])} />
        <Button type="button" variant="outline" onClick={() => fileRef.current?.click()}><Paperclip />Attach files</Button>
        <div className="chat-tags">{files.map((x, i) => <span key={i}>{x.name}<button type="button" aria-label={`Remove ${x.name}`} onClick={() => setFiles(fs => fs.filter((_, j) => j !== i))}><X size={12} /></button></span>)}</div>
      </section>
      <section className="ws-panel chat-col lekha-chat">
        {!review ? <>
          <div className="chat-log">
            
            
            {msgs.map((m, i) => <div key={i} className={`chat-bubble ${m.role === 'user' ? 'me' : 'bot'}`}>{m.content}</div>)}
          </div>
          <div className="chat-input"><Button type="button" size="icon" variant={speech.listening ? 'default' : 'outline'} aria-label={speech.listening ? 'Stop voice input' : 'Speak'} onClick={speech.toggle}>{speech.listening ? <Square /> : <Mic />}</Button><textarea rows={2} value={draft} placeholder={speech.listening ? 'Listening…' : 'Type or speak your notes…'} onChange={e => setDraft(e.target.value)} onKeyDown={e => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); send(); } }} /><Button type="button" size="icon" variant="ghost" aria-label="Attach files" onClick={() => fileRef.current?.click()}><Paperclip /></Button><Button type="button" size="icon" aria-label="Send" onClick={send} disabled={!draft.trim()}><Send /></Button></div>
          {speech.error && <p className="text-xs text-muted-foreground">{speech.error}</p>}
          <Button type="button" disabled={!said} onClick={() => { setF({ observations: said, decision: '', followUp: '', additionalNote: files.length ? `Attached: ${files.map(x => x.name).join(', ')}` : '' }); setReview(true); }}>Prepare health card<ArrowRight /></Button>
        </> : <form className="documentation-review" onSubmit={e => { e.preventDefault(); void run(async () => { await save({ data: { appointmentId: appt.id, ...f } }); onClose(); }, 'Appointment Health Card saved to Sutra.'); }}>
          <h2>Review documentation</h2>
          {([['observations', 'Findings & assessment', true], ['decision', 'Treatment & advice', true], ['followUp', 'Next steps & follow-up', false], ['additionalNote', 'Care team note', false]] as const).map(([k, l, req]) => <label key={k}><span className="ws-label">{l}</span><textarea className="ws-input" rows={2} required={req} value={f[k]} onChange={e => setF({ ...f, [k]: e.target.value })} /></label>)}
          <div className="flex gap-2 mt-auto"><Button type="button" variant="ghost" onClick={() => setReview(false)}><ArrowLeft />Back</Button><Button type="submit" className="flex-1" disabled={busy}>Save to care journey</Button></div>
        </form>}
      </section>
      <section className="checklist-horizontal">
        <h2>Optional documentation topics</h2>
        <div className="check-list">{lekhaChecklist.map(i => <div key={i.key} className={`check-item ${covered.has(i.key) ? 'done' : ''}`}><span className="check-dot">{covered.has(i.key) && <Check size={12} />}</span><div><strong>{i.title}</strong></div></div>)}</div>
      </section>
    </div>
  </>;
}

/* ---------------- Sutra ---------------- */
type JourneyItem = { id: string; when: string; kind: string; title: string; body: string; tag: string };
export function SutraWorkspace({ data, role }: { data: Data; role: DemoRole }) {
  const ask = useServerFn(askSutra);
  const [babyId, setBabyId] = useState(data.babies[0]?.id ?? ''); const baby = data.babies.find(b => b.id === babyId) ?? data.babies[0];
  const [selected, setSelected] = useState<string[]>([]); const [msgs, setMsgs] = useState<Msg[]>([]); const [draft, setDraft] = useState(''); const [thinking, setThinking] = useState(false); const [err, setErr] = useState('');
  const strip = useRef<HTMLDivElement>(null); const speech = useSpeech(setDraft);
  const items: JourneyItem[] = useMemo(() => !baby ? [] : [
    ...data.events.filter(e => e.baby_id === baby.id).map(e => ({ id: 'e' + e.id, when: e.created_at, kind: e.kind, title: e.kind, body: e.summary, tag: 'Journey' })),
    ...data.cards.filter(c => c.baby_id === baby.id).map(c => ({ id: 'c' + c.id, when: c.created_at, kind: 'Health Card', title: `${c.category} update`, body: `${c.observation} — “${c.quote}”`, tag: c.reviewed ? 'Reviewed' : 'Submitted' })),
    ...(role === 'care-team' ? (data.notes as { id: string; baby_id: string; created_at: string; observations: string; decision: string }[]).filter(n => n.baby_id === baby.id).map(n => ({ id: 'n' + n.id, when: n.created_at, kind: 'Appointment Health Card', title: 'Appointment Health Card', body: `${n.observations} · ${n.decision}`, tag: 'Lekha' })) : []),
  ].sort((a, b) => a.when.localeCompare(b.when)), [data, baby, role]);
  useEffect(() => { strip.current?.scrollTo({ left: strip.current.scrollWidth }); setSelected([]); setMsgs([]); }, [babyId]);
  const scroll = (d: number) => strip.current?.scrollBy({ left: d * 300, behavior: 'smooth' });
  async function send() {
    const q = draft.trim(); if (!q || !baby || thinking) return; if (speech.listening) speech.toggle();
    const focus = items.filter(i => selected.includes(i.id)).map(i => `${i.title} (${fmt(i.when)}): ${i.body}`);
    setMsgs(m => [...m, { role: 'user', content: q }]); setDraft(''); setThinking(true); setErr('');
    try { const r = await ask({ data: { babyId: baby.id, question: q, focus, history: msgs.slice(-10) } }); setMsgs(m => [...m, { role: 'assistant', content: r.answer }]); } catch (e) { setErr(e instanceof Error ? e.message : 'Sutra could not answer.'); } finally { setThinking(false); }
  }
  if (!baby) return <><WorkspaceHeading title="Sutra" description="Your connected care journey." /><EmptyState>No care journey yet. It starts when a Care Plan is created.</EmptyState></>;
  return <div className="sutra-compact">
    <WorkspaceHeading title="Sutra" description="Answers grounded in your care journey." />
    <section className="ws-panel sutra-chat">
      {role === 'care-team' ? <ProfileSearch babies={data.babies} value={baby.id} onSelect={id => { if (!thinking) setBabyId(id); }} /> : <p className="nv-sub">{baby.baby_name} · {baby.caregiver_name}</p>}
      {!!msgs.length && <div className="chat-log">{msgs.map((m, i) => <div key={i} className={`chat-bubble ${m.role === 'user' ? 'me' : 'bot'}`}>{m.content}</div>)}</div>}
      {thinking && <p role="status" className="nv-sub">Looking through the journey…</p>}
      {err && <p className="text-sm text-destructive" role="alert">{err}</p>}
      {!!selected.length && <div className="chat-tags">{items.filter(i => selected.includes(i.id)).map(i => <span key={i.id}>{i.title}<Button variant="ghost" size="icon" type="button" aria-label={`Untag ${i.title}`} onClick={() => setSelected(s => s.filter(x => x !== i.id))}><X size={12} /></Button></span>)}</div>}
      <div className="chat-input"><Button type="button" size="icon" variant={speech.listening ? 'default' : 'outline'} aria-label={speech.listening ? 'Stop voice input' : 'Speak'} onClick={speech.toggle}>{speech.listening ? <Square /> : <Mic />}</Button><textarea rows={1} value={draft} placeholder="Ask about the care journey…" onChange={e => setDraft(e.target.value)} onKeyDown={e => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); void send(); } }} /><Button type="button" size="icon" aria-label="Send" disabled={!draft.trim() || thinking} onClick={() => void send()}><Send /></Button></div>
      {speech.error && <p className="text-xs text-muted-foreground">{speech.error}</p>}
    </section>
    <div className="journey-heading"><h2>Care journey</h2><div><Button size="icon" variant="ghost" aria-label="Earlier entries" onClick={() => scroll(-1)}><ChevronLeft /></Button><Button size="icon" variant="ghost" aria-label="Later entries" onClick={() => scroll(1)}><ChevronRight /></Button></div></div>
    {!items.length ? <EmptyState>No journey entries yet.</EmptyState> : <div className="journey-strip-wrap"><div className="journey-strip" ref={strip}>{items.map(i => { const on = selected.includes(i.id); return <Button variant="ghost" type="button" key={i.id} className={`nv-card compact text-left ${on ? 'selected' : ''}`} aria-pressed={on} onClick={() => setSelected(s => on ? s.filter(x => x !== i.id) : [...s, i.id].slice(-12))}>
      <div className="nv-card-top"><span className="nv-tag">{i.kind.includes('Health') ? <HeartPulse /> : i.kind === 'Appointment' ? <CalendarDays /> : <FileText />}{i.kind}</span></div>
      <h3>{i.title}</h3><p className="nv-sub">{fmt(i.when)}</p><p className="text-sm leading-relaxed text-muted-foreground line-clamp-3">{i.body}</p><span className="nv-pill">{on ? 'Selected' : i.tag}</span>
    </Button>; })}</div></div>}
  </div>;
}
