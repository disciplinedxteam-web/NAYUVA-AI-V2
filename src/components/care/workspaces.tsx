import { CareTicket } from './care-ticket';
import { JourneyCarousel } from './journey-carousel';
import { ProductOrb } from '@/components/product-orb';
import { Conversation, ConversationContent, ConversationScrollButton } from '@/components/ai-elements/conversation';
import { Message, MessageContent, MessageResponse } from '@/components/ai-elements/message';
import { PromptInput, PromptInputTextarea, PromptInputFooter, PromptInputSubmit } from '@/components/ai-elements/prompt-input';
import { Shimmer } from '@/components/ai-elements/shimmer';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { GlassToggle } from '@/components/ui/glass-toggle';
import { TopicCards } from './topic-cards';
import { cardText, parseCard, type CareCard } from '@/lib/care-card';
import { useEffect, useMemo, useRef, useState } from 'react';
import { useServerFn } from '@tanstack/react-start';
import { ArrowLeft, ArrowRight, ArrowUp, ChevronDown, ChevronUp, Volume2, CalendarDays, Check, ChevronLeft, ChevronRight, Clock, FileText, HeartPulse, MapPin, Mic, Paperclip, Plus, Search, Send, Sparkles, Square, Stethoscope, User, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { WorkspaceHeading } from './workspace-heading';
import { askSutra, createAppointment, getCareData, saveClinicalNote, updateAppointment, transcribeSpeech, speakText, structureLekhaNote } from '@/lib/care.functions';
import { reasons, type DemoRole } from '@/lib/care-domain';
import { detectChecklist, lekhaChecklist } from '@/lib/lekha-checklist';
import { useLanguage } from '@/components/language-provider';

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
  return <GlassToggle options={options} value={value} onChange={onChange} />;
}
function EmptyState({ children }: { children: React.ReactNode }) { return <div className="care-empty"><p>{children}</p></div>; }

/* Speech capture shared by Lekha and Sutra: browser records, Sarvam STT recognises on the server. */
function useSpeech(onText: (t: string) => void, current = '') {
  const transcribe = useServerFn(transcribeSpeech);
  const [listening, setListening] = useState(false); const [processing, setProcessing] = useState(false); const [error, setError] = useState('');
  const rec = useRef<MediaRecorder | null>(null); const base = useRef('');
  useEffect(() => () => { rec.current?.stream.getTracks().forEach(t => t.stop()); }, []);
  async function toggle() {
    if (listening) { rec.current?.stop(); setListening(false); return; }
    if (!navigator.mediaDevices?.getUserMedia || typeof MediaRecorder === 'undefined') { setError('Voice input is unavailable in this browser — please type.'); return; }
    let stream: MediaStream; try { stream = await navigator.mediaDevices.getUserMedia({ audio: true }); } catch { setError('Microphone permission was denied — please type.'); return; }
    const r = new MediaRecorder(stream); const chunks: Blob[] = []; base.current = current;
    r.ondataavailable = e => { if (e.data.size) chunks.push(e.data); };
    r.onstop = async () => {
      stream.getTracks().forEach(t => t.stop()); const blob = new Blob(chunks, { type: r.mimeType || 'audio/webm' });
      if (blob.size < 2000) { setError('No speech was captured. Please try again.'); return; }
      setProcessing(true);
      try { const buf = new Uint8Array(await blob.arrayBuffer()); let bin = ''; for (let i = 0; i < buf.length; i += 0x8000) bin += String.fromCharCode(...buf.subarray(i, i + 0x8000));
        const res = await transcribe({ data: { audio: btoa(bin), mime: blob.type, language: 'unknown' } }); onText((base.current ? base.current + ' ' : '') + res.transcript); }
      catch (e) { setError(e instanceof Error ? e.message : 'Speech could not be recognised.'); } finally { setProcessing(false); }
    };
    rec.current = r; r.start(); setListening(true); setError('');
  }
  return { listening, processing, error, toggle: () => void toggle() };
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
          return <CareTicket key={a.id} source="Milan" title={b?.baby_name ?? 'Appointment'} subtitle={a.reason} date={fmtDay(a.starts_at)} stamp={a.status === 'Confirmed' || a.status === 'Completed' ? 'Approved' : null} stub={false} fields={[
            { label: 'Caregiver', value: b?.caregiver_name ?? '—' }, { label: 'Time · IST', value: `${fmtTime(a.starts_at)}${a.ends_at ? ` – ${fmtTime(a.ends_at)}` : ''}` },
            { label: 'Status', value: a.status }, { label: 'Location', value: l['facilityName'] || 'Not configured' }, { label: 'Address', value: l['address'] || 'Not recorded' },
            { label: 'Documentation', value: documented ? 'Reviewed in Lekha' : a.status === 'Completed' ? 'Awaiting documentation' : 'Not yet due' },
          ]}>
            {resched && a.status === 'Reschedule requested' && <p className="nv-sub">Requested: {resched.date} at {resched.time}</p>}
            {request === a.id ? <form className="nv-card-actions" onSubmit={e => { e.preventDefault(); void run(async () => { await change({ data: { id: a.id, status: 'Reschedule requested', preferredDate: rDate, preferredTime: rTime } }); setRequest(null); }, 'Reschedule request sent. Your original appointment time has not changed.'); }}>
              <input className="ws-input" type="date" required value={rDate} onChange={e => setRDate(e.target.value)} aria-label="Preferred date" />
              <input className="ws-input" type="time" required value={rTime} onChange={e => setRTime(e.target.value)} aria-label="Preferred time" />
              <Button type="submit" disabled={busy}>Send</Button><Button type="button" variant="ghost" onClick={() => setRequest(null)}>Cancel</Button>
            </form> : <div className="nv-card-actions">
              {!isPast(a) && role === 'caregiver' && <><Button disabled={busy || a.status === 'Confirmed'} onClick={() => void run(() => change({ data: { id: a.id, status: 'Confirmed' } }), 'Appointment confirmed.')}>Confirm</Button><Button variant="outline" onClick={() => setRequest(a.id)}>Reschedule</Button></>}
              {!closed.includes(a.status) && role === 'care-team' && <><Button disabled={busy} onClick={() => void run(() => change({ data: { id: a.id, status: 'Completed' } }), 'Marked as done. It is now waiting in Lekha.')}><Check />Mark done</Button><Button variant="ghost" disabled={busy} onClick={() => void run(() => change({ data: { id: a.id, status: 'Cancelled' } }), 'Appointment cancelled.')}>Cancel</Button></>}
              {role === 'care-team' && a.status === 'Completed' && <Button variant="outline" onClick={onDocument}><FileText />{documented ? 'View in Lekha' : 'Document in Lekha'}</Button>}
              {l['mapsLink']?.startsWith('https://') && <Button asChild variant="ghost"><a href={l['mapsLink']} target="_blank" rel="noreferrer"><MapPin />Map</a></Button>}
            </div>}
          </CareTicket>;
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
  const {language}=useLanguage();
  const create = useServerFn(createAppointment); const settings = data.settings as Record<string, string>;
  const today = new Date(); today.setHours(0, 0, 0, 0);
  const [month, setMonth] = useState(new Date(today.getFullYear(), today.getMonth(), 1));
  const [babyId, setBabyId] = useState(''); const [reason, setReason] = useState(reasons[0] ?? '');
  const [date, setDate] = useState<Date | null>(null); const [time, setTime] = useState(''); const [endTime, setEndTime] = useState('');
  const [mapsLink, setMapsLink] = useState(settings['mapsLink'] ?? ''); const [editPlace, setEditPlace] = useState(false);
  const baby = data.babies.find(b => b.id === babyId);
  const days = useMemo(() => { const first = month.getDay(); const n = new Date(month.getFullYear(), month.getMonth() + 1, 0).getDate(); return [...Array<null>(first).fill(null), ...Array.from({ length: n }, (_, i) => new Date(month.getFullYear(), month.getMonth(), i + 1))]; }, [month]);
  const iso = (d: Date) => `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
  const [confirming, setConfirming] = useState(false); const [stamped, setStamped] = useState(false);
  if (confirming && baby && date) return <div className="scheduler-confirm">
    <h2 className="svara-title">Confirm this appointment</h2>
    <CareTicket source="Milan" title={baby.baby_name} subtitle={reason} date={date.toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })} stamp={stamped ? 'Approved' : null} stubLabel="Care team" fields={[{ label: 'Caregiver', value: baby.caregiver_name }, { label: 'Date', value: date.toLocaleDateString('en-IN', { weekday: 'short', day: 'numeric', month: 'short' }) }, { label: 'Time', value: `${time} – ${endTime} IST` }, { label: 'Reason', value: reason }, { label: 'Location', value: settings['facilityName'] || 'Not configured' }, { label: 'Status', value: 'Scheduled' }]} action={{ label: 'Approve', disabled: busy, onClick: () => { setStamped(true); window.setTimeout(() => { void run(async () => { await create({ data: { babyId: baby.id, date: iso(date), time, endTime, reason, location: { facilityName: settings['facilityName'] ?? '', address: settings['address'] ?? '', mapsLink } } }); onDone(); }, 'Appointment scheduled and shared with the caregiver.');  }, 900); } }} />
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
      <div><span className="ws-label">Care Plan profile</span><ProfileSearch babies={data.babies} value={babyId} onSelect={setBabyId} /></div>
      <label><span className="ws-label">Appointment reason</span><select className="ws-input" value={reason} onChange={e => setReason(e.target.value)}>{reasons.map(r => <option key={r} value={r}>{r}</option>)}</select></label>
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
      <div className="ws-grid">{list.map(a => { const b = data.babies.find(x => x.id === a.baby_id); const n = noteFor(a.id); return <CareTicket key={a.id} source="Lekha" title={b?.baby_name ?? 'Appointment'} subtitle={a.reason} date={fmt(a.starts_at)} card={n ? parseCard(n.observations) : null} stamp={n ? 'Reviewed' : null} stub={!n} fields={[{ label: 'Caregiver', value: b?.caregiver_name ?? '—' }, { label: 'Appointment', value: 'Completed' }, { label: 'Location', value: loc(a)['facilityName'] || 'Not configured' }]} action={{ label: 'Document', onClick: () => setOpenId(a.id) }}>
        {n && !parseCard(n.observations) && <p className="nv-sub">{n.observations}</p>}
        {n?.follow_up && <p className="nv-sub">Follow-up · {n.follow_up}</p>}
      </CareTicket>; })}</div>}

  </>;
}

type Msg = { role: 'user' | 'assistant'; content: string };
function LekhaSession({ data, appt, busy, run, onClose }: { data: Data; appt: Appointment; busy: boolean; run: Run; onClose: () => void }) {
  const save = useServerFn(saveClinicalNote); const baby = data.babies.find(b => b.id === appt.baby_id);
  const [msgs, setMsgs] = useState<Msg[]>([]); const [draft, setDraft] = useState(''); const [files, setFiles] = useState<File[]>([]); const [review, setReview] = useState(false);
  const [card, setCard] = useState<CareCard | null>(null); const [approved, setApproved] = useState(false);
  const speech = useSpeech(setDraft, draft); const organise = useServerFn(structureLekhaNote); const [organising, setOrganising] = useState(false); const [aiNote, setAiNote] = useState(''); const fileRef = useRef<HTMLInputElement>(null);
  const said = msgs.filter(m => m.role === 'user').map(m => m.content).join('\n');
  const covered = detectChecklist(said + ' ' + draft, files.length);
  function send() { const t = draft.trim(); if (!t) return; if (speech.listening) speech.toggle(); setMsgs(m => [...m, { role: 'user', content: t }]); setDraft(''); }
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
          <div className="chat-input"><Button type="button" size="icon" variant={speech.listening ? 'default' : 'outline'} aria-label={speech.listening ? 'Stop voice input' : 'Speak'} onClick={speech.toggle}>{speech.listening ? <Square /> : <Mic />}</Button><textarea rows={2} value={draft} placeholder={speech.listening ? 'Recording… tap stop when done' : speech.processing ? 'Recognising speech…' : 'Type or speak your notes…'} onChange={e => setDraft(e.target.value)} onKeyDown={e => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); send(); } }} /><Button type="button" size="icon" variant="ghost" aria-label="Attach files" onClick={() => fileRef.current?.click()}><Paperclip /></Button><Button type="button" size="icon" aria-label="Send" onClick={send} disabled={!draft.trim()}><Send /></Button></div>
          {speech.error && <p className="text-xs text-muted-foreground">{speech.error}</p>}
          <Button type="button" disabled={!said || organising} onClick={() => { setOrganising(true); setAiNote(''); void organise({ data: { appointmentId: appt.id, note: said + (files.length ? `\nAttached: ${files.map(x => x.name).join(', ')}` : ''), checklist: lekhaChecklist.map(i => ({ key: i.key, title: i.title })) } }).then(d => { setCard(d); setApproved(false); setReview(true); }).catch(e => setAiNote(e instanceof Error ? e.message : 'Lekha could not organise the note.')).finally(() => setOrganising(false)); }}>{organising ? 'Lekha is summarising…' : 'Done — create card'}<ArrowRight /></Button>
          {aiNote && <p className="text-xs text-muted-foreground" role="status">{aiNote}</p>}
        </> : <form className="documentation-review" onSubmit={e => { e.preventDefault(); if (!card) return; void run(async () => { await save({ data: { appointmentId: appt.id, observations: JSON.stringify(card), decision: cardText(card), followUp: card.topics.find(t => /follow/i.test(t.title))?.finding ?? '', additionalNote: files.map(x => x.name).join(', ') } }); onClose(); }, 'Appointment Health Card saved to Sutra.'); }}>
          <CareTicket source="Lekha" title={baby?.baby_name ?? 'Appointment'} subtitle={appt.reason} date={fmtDay(appt.starts_at)} card={card} stamp={approved ? 'Reviewed' : null} stubLabel="Clinician review" action={{ label: 'Mark reviewed', onClick: () => setApproved(true) }} />
          <div className="flex gap-2 mt-auto"><Button type="button" variant="ghost" onClick={() => setReview(false)}><ArrowLeft />Back</Button><Button type="submit" className="flex-1" disabled={busy || !approved}>Save to care journey</Button></div>
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
type JourneyItem = { id: string; when: string; kind: string; title: string; body: string; tag: string; card?: CareCard | null };
export function SutraWorkspace({ data, role }: { data: Data; role: DemoRole }) {
  const ask = useServerFn(askSutra);
  const [babyId, setBabyId] = useState(role === 'caregiver' ? data.babies[0]?.id ?? '' : ''); const baby = data.babies.find(b => b.id === babyId);
  const [journeyOpen, setJourneyOpen] = useState(false); const [profileOpen, setProfileOpen] = useState(false); const [search, setSearch] = useState('');
  const inputRef = useRef<HTMLTextAreaElement>(null); const requestVersion = useRef(0);
  const [selected, setSelected] = useState<string[]>([]); const [msgs, setMsgs] = useState<Msg[]>([]); const [draft, setDraft] = useState(''); const [thinking, setThinking] = useState(false); const [err, setErr] = useState('');
  const strip = useRef<HTMLDivElement>(null); const speech = useSpeech(setDraft, draft); const speak = useServerFn(speakText); const audio = useRef<HTMLAudioElement | null>(null); const cache = useRef(new Map<number, string>()); const [playing, setPlaying] = useState<number | null>(null);
  useEffect(() => () => audio.current?.pause(), []);
  async function play(i: number, text: string) { audio.current?.pause(); if (playing === i) { setPlaying(null); return; } setErr(''); try { let src = cache.current.get(i); if (!src) { src = 'data:audio/wav;base64,' + (await speak({ data: { text, language: 'en-IN' } })).audio; cache.current.set(i, src); } const a = new Audio(src); audio.current = a; a.onended = () => setPlaying(null); setPlaying(i); await a.play(); } catch (e) { setPlaying(null); setErr(e instanceof Error ? e.message : 'Audio unavailable.'); } }
  const items: JourneyItem[] = useMemo(() => !baby ? [] : [
    ...data.events.filter(e => e.baby_id === baby.id).map(e => ({ id: 'e' + e.id, when: e.created_at, kind: e.kind, title: e.kind, body: e.summary, tag: 'Journey' })),
    ...data.appointments.filter(a => a.baby_id === baby.id).map(a => ({ id: 'a' + a.id, when: a.starts_at, kind: 'Appointment', title: a.reason, body: `${a.status} · ${fmt(a.starts_at)} · ${loc(a)['facilityName'] || 'Location not configured'}`, tag: a.status })),
    ...data.cards.filter(c => c.baby_id === baby.id).map(c => ({ id: 'c' + c.id, when: c.created_at, kind: 'Health Card', title: `${c.category} update`, card: parseCard(c.summary_text), body: (() => { const k = parseCard(c.summary_text); return k ? cardText(k) : `${c.summary_text||c.observation} — “${c.quote}”`; })(), tag: c.reviewed ? 'Reviewed' : 'Submitted' })),
    ...(role === 'care-team' ? (data.notes as { id: string; baby_id: string; created_at: string; observations: string; decision: string }[]).filter(n => n.baby_id === baby.id).map(n => ({ id: 'n' + n.id, when: n.created_at, kind: 'Appointment Health Card', title: 'Appointment Health Card', card: parseCard(n.observations), body: parseCard(n.observations) ? n.decision : `${n.observations} · ${n.decision}`, tag: 'Reviewed' })) : []),
  ].sort((a, b) => a.when.localeCompare(b.when)), [data, baby, role]);
  useEffect(() => { requestVersion.current++; setSelected([]); setMsgs([]); setErr(''); setDraft(''); cache.current.clear(); audio.current?.pause(); inputRef.current?.focus(); }, [babyId]);
  const scroll = (d: number) => strip.current?.scrollBy({ left: d * 300, behavior: 'smooth' });
  async function send() {
    const q = draft.trim(); if (!q || !baby || thinking) return; if (speech.listening) speech.toggle();
    const version = requestVersion.current;
    const focus = items.filter(i => selected.includes(i.id)).map(i => `${i.title} (${fmt(i.when)}): ${i.body}`.slice(0, 1200));
    setMsgs(m => [...m, { role: 'user', content: q }]); setDraft(''); setThinking(true); setErr(''); inputRef.current?.focus();
    try { const r = await ask({ data: { babyId: baby.id, question: q, focus, history: msgs.slice(-10) } }); if (version === requestVersion.current) setMsgs(m => [...m, { role: 'assistant', content: r.answer }]); } catch (e) { setErr(e instanceof Error ? e.message : 'Sutra could not answer.'); } finally { setThinking(false); inputRef.current?.focus(); }
  }
  const matchingBabies = data.babies.filter(b => `${b.baby_name} ${b.caregiver_name}`.toLowerCase().includes(search.toLowerCase()));
  return <div className="sutra-room">
    <div className="sutra-room-head"><WorkspaceHeading title="Sutra" description={baby ? `${baby.baby_name} · Connected care journey` : 'Your connected care journey.'} />
      <Button variant="ghost" size="sm" aria-label={journeyOpen ? 'Hide care journey' : 'Show care journey'} aria-expanded={journeyOpen} disabled={!baby} onClick={() => setJourneyOpen(v => !v)}>Care journey{journeyOpen ? <ChevronUp /> : <ChevronDown />}</Button>
    </div>
    <div className={`sutra-journey-reveal ${journeyOpen ? 'open' : ''}`} inert={!journeyOpen}>
      <div>{items.length ? <JourneyCarousel entries={items.map(i => ({ id: i.id, label: `${i.title} ${fmtDay(i.when)}`, content: <CareTicket stub={false} source={i.kind.includes('Appointment') ? 'Milan' : i.kind.includes('Health') ? 'Svara' : i.kind} title={i.title} date={fmt(i.when)} subtitle={i.tag} stamp={i.tag === 'Reviewed' ? 'Reviewed' : null} card={i.card ?? null} fields={i.card ? undefined : [{ label: 'Details', value: i.body }]} /> }))} active={selected} onSelect={id => setSelected(s => s.includes(id) ? s.filter(x => x !== id) : [...s, id].slice(-12))} /> : <p className="sutra-no-entries">No journey entries yet.</p>}</div>
    </div>
    <Conversation className="sutra-conversation">
      <ConversationContent className="sutra-messages">
        {msgs.map((m, i) => <Message key={`${babyId}-${i}`} from={m.role}><MessageContent><MessageResponse>{m.content}</MessageResponse></MessageContent>{m.role === 'assistant' && <Button type="button" size="icon-sm" variant="ghost" aria-label={playing === i ? 'Stop playback' : 'Listen to answer'} title="Listen to answer" onClick={() => void play(i, m.content)}>{playing === i ? <Square /> : <Volume2 />}</Button>}</Message>)}
        {thinking && <Shimmer>Looking through the care journey…</Shimmer>}
        {err && <p className="text-destructive text-sm" role="alert">{err}</p>}
      </ConversationContent>
      <ConversationScrollButton />
    </Conversation>
    <div className="sutra-composer-anchor">
      <div className={`sutra-welcome ${msgs.length ? 'departed' : ''}`} aria-hidden={!!msgs.length}>
        <div className="sutra-welcome-orb"><ProductOrb name="SUTRA" state="reasoning" /></div><div><h2>{baby ? `A connected story of ${baby.baby_name}’s care` : 'Every care journey, connected.'}</h2><p>{baby ? 'What would you like to look back on?' : 'Select a baby to begin.'}</p></div>
      </div>
      {!!selected.length && <div className="sutra-focus-tags">{items.filter(i => selected.includes(i.id)).map(i => <span key={i.id}>{i.title}<Button variant="ghost" size="icon-xs" aria-label={`Remove ${i.title}`} onClick={() => setSelected(s => s.filter(x => x !== i.id))}><X /></Button></span>)}</div>}
      <PromptInput className="sutra-composer" onSubmit={() => send()}>
        <PromptInputTextarea ref={inputRef} autoFocus value={draft} maxLength={1500} disabled={!baby || speech.processing} aria-label="Ask Sutra" placeholder={!baby ? 'Select a baby profile to begin…' : speech.listening ? 'Recording… stop to edit your words' : 'Ask about the care journey…'} onChange={e => setDraft(e.target.value)} />
        <PromptInputFooter className="sutra-composer-footer">
          {role === 'care-team' ? <Popover open={profileOpen} onOpenChange={setProfileOpen}><PopoverTrigger asChild><Button variant="secondary" size="sm" type="button" disabled={thinking} aria-label="Select baby profile"><User />{baby?.baby_name ?? 'Select baby'}<ChevronDown /></Button></PopoverTrigger><PopoverContent side="top" align="start" className="sutra-profile-menu"><div className="sutra-profile-search"><Search size={16} /><input autoFocus aria-label="Search baby profiles" placeholder="Search baby or caregiver" value={search} onChange={e => setSearch(e.target.value)} /></div><div className="sutra-profile-list">{matchingBabies.map(b => <Button key={b.id} variant="ghost" className="sutra-profile-option" onClick={() => { setBabyId(b.id); setProfileOpen(false); setSearch(''); }}><span className="sutra-profile-initial">{b.baby_name.charAt(0)}</span><span><strong>{b.baby_name}</strong><small>{b.caregiver_name}</small></span>{b.id === babyId && <Check />}</Button>)}{!matchingBabies.length && <p>No matching profiles.</p>}</div></PopoverContent></Popover> : <span className="sutra-composer-identity">{baby?.baby_name ?? 'Care journey'}</span>}
          <div className="sutra-composer-actions"><Button type="button" size="icon" variant={speech.listening ? 'default' : 'ghost'} disabled={!baby || thinking || speech.processing} aria-label={speech.listening ? 'Stop voice input' : 'Speak'} title="Voice input" onClick={speech.toggle}>{speech.listening ? <Square /> : <Mic />}</Button><PromptInputSubmit aria-label="Send to Sutra" status={thinking ? 'submitted' : 'ready'} disabled={!baby || !draft.trim() || thinking || speech.listening || speech.processing}>{thinking ? undefined : <ArrowUp />}</PromptInputSubmit></div>
        </PromptInputFooter>
      </PromptInput>
      {speech.error && <p className="text-destructive text-xs" role="alert">{speech.error}</p>}
    </div>
  </div>;
}
