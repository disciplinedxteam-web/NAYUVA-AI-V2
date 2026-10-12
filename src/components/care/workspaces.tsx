import { useEffect, useMemo, useRef, useState } from 'react';
import { useServerFn } from '@tanstack/react-start';
import { ArrowLeft, ArrowRight, CalendarDays, Check, ChevronLeft, ChevronRight, Clock, FileText, HeartPulse, MapPin, Mic, Paperclip, Plus, Search, Send, Sparkles, Square, Stethoscope, User, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Mascot, SpeechHeader } from './mascot';
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

function Toggle({ options, value, onChange }: { options: { key: string; label: string; count: number }[]; value: string; onChange: (k: string) => void }) {
  return <div className="ws-toggle" role="group">{options.map(o => <button key={o.key} type="button" aria-pressed={value === o.key} onClick={() => onChange(o.key)}>{o.label}<span className="count">{o.count}</span></button>)}</div>;
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
  const isPast = (a: Appointment) => closed.includes(a.status);
  const upcoming = data.appointments.filter(a => !isPast(a)).sort((a, b) => a.starts_at.localeCompare(b.starts_at));
  const past = data.appointments.filter(isPast).sort((a, b) => b.starts_at.localeCompare(a.starts_at));
  const list = tab === 'upcoming' ? upcoming : past;
  const babyOf = (id: string) => data.babies.find(b => b.id === id);
  return <>
    <SpeechHeader name="milan" state={scheduling || busy ? 'working' : 'idle'} title="Hi, I'm Milan" text={scheduling ? "Pick the baby, a date and a time — I'll note it down and share it with the caregiver." : role === 'care-team' ? "I'm here to coordinate appointments and keep your follow-ups on track." : "I keep your baby's appointments in one place. Confirm, or ask for a new time."} />
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
            <div className="nv-row"><CalendarDays /><div><strong>{fmtDay(a.starts_at)}</strong><small>{fmtTime(a.starts_at)} IST</small></div></div>
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

const times = Array.from({ length: 21 }, (_, i) => { const h = 8 + Math.floor(i / 2); const m = i % 2 ? '30' : '00'; return `${String(h).padStart(2, '0')}:${m}`; });
const label12 = (t: string) => { const [h, m] = t.split(':').map(Number); return `${((h! + 11) % 12) + 1}:${String(m).padStart(2, '0')} ${h! < 12 ? 'AM' : 'PM'}`; };
function Scheduler({ data, busy, run, onDone }: { data: Data; busy: boolean; run: Run; onDone: () => void }) {
  const create = useServerFn(createAppointment); const settings = data.settings as Record<string, string>;
  const today = new Date(); today.setHours(0, 0, 0, 0);
  const [month, setMonth] = useState(new Date(today.getFullYear(), today.getMonth(), 1));
  const [search, setSearch] = useState(''); const [babyId, setBabyId] = useState(data.babies[0]?.id ?? '');
  const [reason, setReason] = useState(reasons[0] ?? 'Routine newborn follow-up'); const [date, setDate] = useState<Date | null>(null); const [time, setTime] = useState('10:30');
  const [place, setPlace] = useState({ facilityName: settings['facilityName'] ?? '', address: settings['address'] ?? '', mapsLink: settings['mapsLink'] ?? '' }); const [editPlace, setEditPlace] = useState(false);
  const baby = data.babies.find(b => b.id === babyId);
  const days = useMemo(() => { const first = month.getDay(); const n = new Date(month.getFullYear(), month.getMonth() + 1, 0).getDate(); return [...Array<null>(first).fill(null), ...Array.from({ length: n }, (_, i) => new Date(month.getFullYear(), month.getMonth(), i + 1))]; }, [month]);
  const iso = (d: Date) => `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
  return <form className="ws-split" onSubmit={e => { e.preventDefault(); if (!baby || !date) return; void run(async () => { await create({ data: { babyId: baby.id, date: iso(date), time, reason, location: place } }); onDone(); }, `Appointment scheduled for ${baby.baby_name} and shared with the caregiver.`); }}>
    <section className="ws-panel">
      <div className="ws-panel-title"><CalendarDays /><div>Appointment details<small>Who and why</small></div></div>
      <div><span className="ws-label">Baby</span><div className="search-field"><Search /><input className="ws-input" placeholder="Search baby or caregiver" value={search} onChange={e => setSearch(e.target.value)} /></div></div>
      <div className="ws-baby-list">{data.babies.filter(b => (b.baby_name + b.caregiver_name).toLowerCase().includes(search.toLowerCase())).map(b => <button type="button" key={b.id} className="ws-baby" aria-pressed={b.id === babyId} onClick={() => setBabyId(b.id)}><span className="ws-avatar">{b.baby_name.charAt(0)}</span><span><strong className="text-sm">{b.baby_name}</strong><small className="block text-xs text-muted-foreground">Caregiver · {b.caregiver_name}</small></span>{b.id === babyId && <Check className="ml-auto text-primary" size={16} />}</button>)}</div>
      <label><span className="ws-label">Appointment reason</span><select className="ws-input" value={reason} onChange={e => setReason(e.target.value)}>{reasons.map(r => <option key={r}>{r}</option>)}</select></label>
      <div><div className="flex items-center justify-between"><span className="ws-label">Location</span><button type="button" className="text-xs font-semibold text-primary" onClick={() => setEditPlace(v => !v)}>{editPlace ? 'Done' : 'Change'}</button></div>
        {editPlace ? <div className="flex flex-col gap-2"><input className="ws-input" placeholder="Facility name" value={place.facilityName} onChange={e => setPlace({ ...place, facilityName: e.target.value })} /><input className="ws-input" placeholder="Address" value={place.address} onChange={e => setPlace({ ...place, address: e.target.value })} /><input className="ws-input" placeholder="Map link (https://…)" value={place.mapsLink} onChange={e => setPlace({ ...place, mapsLink: e.target.value })} /></div>
          : <div className="nv-row"><MapPin /><div><strong>{place.facilityName || 'No facility set'}</strong><small>{place.address || 'Pre-filled from Settings'}</small></div></div>}</div>
      <div className="ws-summary mt-auto"><CalendarDays size={18} className="text-primary" /><span>{date ? <>{date.toLocaleDateString('en-IN', { weekday: 'short', day: 'numeric', month: 'short' })} · {label12(time)} IST{baby && <> · for {baby.baby_name}</>}</> : 'Choose a date on the calendar'}</span></div>
      <div className="flex gap-2"><Button type="button" variant="ghost" onClick={onDone}><ArrowLeft />Back</Button><Button type="submit" className="flex-1" disabled={busy || !baby || !date}>Schedule appointment<ArrowRight /></Button></div>
    </section>
    <section className="ws-panel">
      <div className="ws-panel-title"><Clock /><div>Date & time<small>India Standard Time</small></div></div>
      <div className="cal-head"><Button type="button" variant="ghost" size="icon" aria-label="Previous month" disabled={month <= new Date(today.getFullYear(), today.getMonth(), 1)} onClick={() => setMonth(new Date(month.getFullYear(), month.getMonth() - 1, 1))}><ChevronLeft /></Button><strong>{month.toLocaleDateString('en-IN', { month: 'long', year: 'numeric' })}</strong><Button type="button" variant="ghost" size="icon" aria-label="Next month" onClick={() => setMonth(new Date(month.getFullYear(), month.getMonth() + 1, 1))}><ChevronRight /></Button></div>
      <div className="cal-grid">{['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(d => <span key={d}>{d}</span>)}{days.map((d, i) => d ? <button type="button" key={i} disabled={d < today} aria-pressed={!!date && d.getTime() === date.getTime()} onClick={() => setDate(d)}>{d.getDate()}</button> : <i key={i} />)}</div>
      <div><span className="ws-label">Start time</span><div className="time-chips">{times.map(t => <button type="button" key={t} aria-pressed={t === time} onClick={() => setTime(t)}>{label12(t)}</button>)}</div></div>
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
    <SpeechHeader name="lekha" title="Hi, I'm Lekha" text="I'm here to turn clinical conversations into structured documentation." />
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
  const state = review ? 'done' : speech.listening || draft ? 'listening' : 'idle';
  function send() { const t = draft.trim(); if (!t) return; if (speech.listening) speech.toggle(); const now = detectChecklist(said + ' ' + t, files.length); const missing = lekhaChecklist.filter(i => !now.has(i.key) && i.key !== 'files').slice(0, 2).map(i => i.title.toLowerCase()); setMsgs(m => [...m, { role: 'user', content: t }, { role: 'assistant', content: `Noted. ${now.size}/${lekhaChecklist.length} checklist topics covered.${missing.length ? ` If relevant, you could add ${missing.join(' and ')}.` : ' Everything is covered — prepare the card when ready.'}` }]); setDraft(''); }
  return <>
    <div className="flex items-center justify-between mb-4"><Button variant="ghost" onClick={onClose}><ArrowLeft />Create Appointment Health Card</Button><span className="nv-pill">{review ? 'Review' : 'In progress'}</span></div>
    <div className="ws-three">
      <section className="ws-panel">
        <div className="ws-panel-title"><CalendarDays /><div>Appointment details<small>From Milan</small></div></div>
        <div className="nv-row"><FileText /><div><strong>{appt.reason}</strong><small>Completed</small></div></div>
        <div className="nv-row"><CalendarDays /><div><strong>{fmtDay(appt.starts_at)}</strong><small>{fmtTime(appt.starts_at)} IST</small></div></div>
        <div className="nv-row"><User /><div><strong>{baby?.baby_name}</strong><small>Caregiver · {baby?.caregiver_name}</small></div></div>
        <div className="nv-row"><MapPin /><div><strong>{loc(appt)['facilityName'] || 'Location not set'}</strong><small>{loc(appt)['address'] || '—'}</small></div></div>
        <div className="ws-panel-title mt-2"><Paperclip /><div>Reports & files<small>Names are noted on the card</small></div></div>
        <input ref={fileRef} type="file" multiple hidden accept=".pdf,.jpg,.jpeg,.png" onChange={e => setFiles(x => [...x, ...Array.from(e.target.files ?? [])])} />
        <Button type="button" variant="outline" onClick={() => fileRef.current?.click()}><Paperclip />Attach files</Button>
        <div className="chat-tags">{files.map((x, i) => <span key={i}>{x.name}<button type="button" aria-label={`Remove ${x.name}`} onClick={() => setFiles(fs => fs.filter((_, j) => j !== i))}><X size={12} /></button></span>)}</div>
      </section>
      <section className="ws-panel chat-col">
        {!review ? <>
          <div className="chat-log">
            <div className="flex flex-col items-center gap-2 py-2"><Mascot name="lekha" state={state} size={130} /></div>
            <div className="chat-bubble bot"><strong>Hi, I'm Lekha.</strong>{'\n'}Tell me what happened in {baby?.baby_name}'s appointment — speak or type. I'll tick the checklist as you cover topics. Nothing is saved until you review it.</div>
            {msgs.map((m, i) => <div key={i} className={`chat-bubble ${m.role === 'user' ? 'me' : 'bot'}`}>{m.content}</div>)}
          </div>
          <div className="chat-input"><Button type="button" size="icon" variant={speech.listening ? 'default' : 'outline'} aria-label={speech.listening ? 'Stop voice input' : 'Speak'} onClick={speech.toggle}>{speech.listening ? <Square /> : <Mic />}</Button><textarea rows={2} value={draft} placeholder={speech.listening ? 'Listening…' : 'Type or speak your notes…'} onChange={e => setDraft(e.target.value)} onKeyDown={e => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); send(); } }} /><Button type="button" size="icon" variant="ghost" aria-label="Attach files" onClick={() => fileRef.current?.click()}><Paperclip /></Button><Button type="button" size="icon" aria-label="Send" onClick={send} disabled={!draft.trim()}><Send /></Button></div>
          {speech.error && <p className="text-xs text-muted-foreground">{speech.error}</p>}
          <Button type="button" disabled={!said} onClick={() => { setF({ observations: said, decision: '', followUp: '', additionalNote: files.length ? `Attached: ${files.map(x => x.name).join(', ')}` : '' }); setReview(true); }}>Prepare health card<ArrowRight /></Button>
        </> : <form className="flex flex-col gap-3 h-full" onSubmit={e => { e.preventDefault(); void run(async () => { await save({ data: { appointmentId: appt.id, ...f } }); onClose(); }, 'Appointment Health Card saved to Sutra.'); }}>
          <div className="mini-mascot-row"><Mascot name="lekha" state="done" size={84} /><div><strong>Your card is ready to review</strong><p className="text-xs text-muted-foreground">Edit anything before saving. You stay in control.</p></div></div>
          {([['observations', 'Findings & assessment', true], ['decision', 'Treatment & advice', true], ['followUp', 'Next steps & follow-up', false], ['additionalNote', 'Care team note', false]] as const).map(([k, l, req]) => <label key={k}><span className="ws-label">{l}</span><textarea className="ws-input" rows={k === 'observations' ? 4 : 2} required={req} value={f[k]} onChange={e => setF({ ...f, [k]: e.target.value })} /></label>)}
          <div className="flex gap-2 mt-auto"><Button type="button" variant="ghost" onClick={() => setReview(false)}><ArrowLeft />Back</Button><Button type="submit" className="flex-1" disabled={busy}>Save to care journey</Button></div>
        </form>}
      </section>
      <section className="ws-panel">
        <div className="ws-panel-title"><Sparkles /><div>Documentation guide<small>Optional — ticks itself as you cover topics</small></div></div>
        <div className="check-list">{lekhaChecklist.map(i => <div key={i.key} className={`check-item ${covered.has(i.key) ? 'done' : ''}`}><span className="check-dot">{covered.has(i.key) && <Check size={12} />}</span><div><strong>{i.title}</strong><small>{i.hint}</small></div></div>)}</div>
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
  if (!baby) return <><SpeechHeader name="sutra" title="Hi, I'm Sutra" text="I bring your baby's care journey together in one place." /><EmptyState>No care journey yet. It starts when a care plan is created.</EmptyState></>;
  return <>
    <SpeechHeader name="sutra" state={thinking ? 'working' : 'idle'} title="Hi, I'm Sutra" text={`I bring ${baby.baby_name}'s care journey together — every update, appointment and note, in order.`} />
    {role === 'care-team' && data.babies.length > 1 && <div className="ws-bar"><div className="ws-toggle" role="group">{data.babies.map(b => <button key={b.id} type="button" aria-pressed={b.id === baby.id} onClick={() => setBabyId(b.id)}>{b.baby_name}</button>)}</div></div>}
    {!items.length ? <EmptyState>No journey entries yet.</EmptyState> : <div className="journey-strip-wrap">
      <Button className="strip-arrow left" size="icon" variant="outline" aria-label="Scroll left" onClick={() => scroll(-1)}><ChevronLeft /></Button>
      <div className="journey-strip" ref={strip}>{items.map(i => { const on = selected.includes(i.id); return <button type="button" key={i.id} className={`nv-card compact text-left ${on ? 'selected' : ''}`} aria-pressed={on} onClick={() => setSelected(s => on ? s.filter(x => x !== i.id) : [...s, i.id])}>
        <div className="nv-card-top"><span className="nv-tag">{i.kind.includes('Health') ? <HeartPulse /> : i.kind === 'Appointment' ? <CalendarDays /> : <FileText />}{i.kind}</span><span className={`nv-pill ${on ? 'ok' : ''}`}>{on ? 'Selected' : i.tag}</span></div>
        <h3>{i.title}</h3><p className="nv-sub">{fmt(i.when)}</p><p className="text-[13px] leading-relaxed text-muted-foreground line-clamp-5">{i.body}</p>
        <span className="mt-auto text-xs font-semibold text-primary">{on ? '✓ Tagged in chat' : 'Tap to ask about this'}</span>
      </button>; })}</div>
      <Button className="strip-arrow right" size="icon" variant="outline" aria-label="Scroll right" onClick={() => scroll(1)}><ChevronRight /></Button>
    </div>}
    <section className="ws-panel mt-6">
      <div className="mini-mascot-row"><Mascot name="sutra" state={thinking ? 'working' : 'idle'} size={64} /><div><strong>Ask Sutra about this care journey</strong><p className="text-xs text-muted-foreground">I only answer from {baby.baby_name}'s journey above. I can't give medical advice — for anything urgent, contact your care team.</p></div></div>
      {!!msgs.length && <div className="chat-log">{msgs.map((m, i) => <div key={i} className={`chat-bubble ${m.role === 'user' ? 'me' : 'bot'}`}>{m.content}</div>)}{thinking && <div className="chat-bubble bot">Looking through the journey…</div>}</div>}
      {err && <p className="text-sm text-destructive" role="alert">{err}</p>}
      {!!selected.length && <div className="chat-tags">{items.filter(i => selected.includes(i.id)).map(i => <span key={i.id}>{i.title}<button type="button" aria-label={`Untag ${i.title}`} onClick={() => setSelected(s => s.filter(x => x !== i.id))}><X size={12} /></button></span>)}</div>}
      <div className="chat-input"><Button type="button" size="icon" variant={speech.listening ? 'default' : 'outline'} aria-label={speech.listening ? 'Stop voice input' : 'Speak'} onClick={speech.toggle}>{speech.listening ? <Square /> : <Mic />}</Button><textarea rows={1} value={draft} placeholder="Ask anything about the care journey…" onChange={e => setDraft(e.target.value)} onKeyDown={e => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); void send(); } }} /><Button type="button" size="icon" aria-label="Send" disabled={!draft.trim() || thinking} onClick={() => void send()}><Send /></Button></div>
      {speech.error && <p className="text-xs text-muted-foreground">{speech.error}</p>}
    </section>
  </>;
}
