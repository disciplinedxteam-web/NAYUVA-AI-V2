import { SearchToggle } from '@/components/ui/search-toggle';
import { CareTicket } from './care-ticket';
import { OnlineMeeting } from './online-meeting';
import { useQuery } from '@tanstack/react-query';
import { CardGeneration } from './card-generation';
import { AssistantCharacter } from './assistant-character';
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
import { ArrowLeft, ArrowRight, ArrowUp, ChevronDown, ChevronUp, Volume2, CalendarDays, Video, Check, ChevronLeft, ChevronRight, Clock, FileText, HeartPulse, MapPin, Mic, Paperclip, Plus, Search, Send, Sparkles, Square, Stethoscope, User, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { WorkspaceHeading } from './workspace-heading';
import { getOnlineAppointments, getAppointmentTranscript, askSutra, createAppointment, getCareData, saveClinicalNote, updateAppointment, transcribeSpeech, speakText, structureLekhaNote } from '@/lib/care.functions';
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
  const [search,setSearch]=useState(''),[meeting,setMeeting]=useState('');
  const getOnline=useServerFn(getOnlineAppointments);const online=useQuery({queryKey:['online-appointments',role],queryFn:getOnline});
  const [tab, setTab] = useState('upcoming'); const [scheduling, setScheduling] = useState(false); const [request, setRequest] = useState<string | null>(null); const [rDate, setRDate] = useState(''); const [rTime, setRTime] = useState('');
  const isPast = (a: Appointment) => closed.includes(a.status) || new Date(a.starts_at).getTime() < Date.now();
  const upcoming = data.appointments.filter(a => !isPast(a)).sort((a, b) => a.starts_at.localeCompare(b.starts_at));
  const past = data.appointments.filter(isPast).sort((a, b) => b.starts_at.localeCompare(a.starts_at));
  const list = (tab === 'upcoming' ? upcoming : past).filter(a=>{const b=data.babies.find(x=>x.id===a.baby_id);return `${b?.baby_name??''} ${b?.caregiver_name??''}`.toLowerCase().includes(search.toLowerCase());});
  const babyOf = (id: string) => data.babies.find(b => b.id === id);
  if(meeting)return <OnlineMeeting id={meeting} onClose={()=>setMeeting('')}/>;
  return <>
    <WorkspaceHeading title="Milan" description="Appointments and coordinated follow-up care." />
    {scheduling ? <Scheduler data={data} busy={busy} run={run} onDone={() => setScheduling(false)} /> : <>
      <div className="ws-bar">
        <div className="ws-bar-cluster">
          <SearchToggle label="Filter Milan by baby" value={search} onChange={setSearch}><Toggle value={tab} onChange={setTab} options={[{ key: 'upcoming', label: 'Upcoming', count: upcoming.length }, { key: 'past', label: 'Past', count: past.length }]} /></SearchToggle>
          {role === 'care-team' && <Button className="ws-bar-action" onClick={() => setScheduling(true)} disabled={!data.babies.length}><Plus />Schedule Appointment</Button>}
        </div>
      </div>
      {!list.length ? <EmptyState>{tab === 'upcoming' ? 'No upcoming appointments.' : 'No past appointments yet.'}</EmptyState> :
        <div className="ws-grid">{list.map(a => {
          const b = babyOf(a.baby_id); const l = loc(a); const resched = a.reschedule as { date: string; time: string } | null;
          const documented = data.notes.some(n => (n as { appointment_id?: string }).appointment_id === a.id);
          return <CareTicket key={a.id} source="Milan" title={b?.baby_name ?? 'Appointment'} subtitle={a.reason} date={fmtDay(a.starts_at)} stamp={null} stub={false} fields={[
            { label: 'Caregiver', value: b?.caregiver_name ?? '—' }, { label: 'Time · IST', value: `${fmtTime(a.starts_at)}${a.ends_at ? ` – ${fmtTime(a.ends_at)}` : ''}` },
            { label: 'Status', value: a.status }, { label: 'Mode', value: l['mode']==='online'?'Online video':'In-person' }, { label: 'Location', value: l['mode']==='online'?'Private Nayuva consultation':l['facilityName'] || 'Not configured' }, { label: 'Address', value: l['address'] || 'Not recorded' },
            { label: 'Documentation', value: documented ? 'Reviewed in Lekha' : a.status === 'Completed' ? 'Awaiting documentation' : 'Not yet due' },
          ]}>
            {resched && a.status === 'Reschedule requested' && <p className="nv-sub">Requested: {resched.date} at {resched.time}</p>}
            {request === a.id ? <form className="nv-card-actions" onSubmit={e => { e.preventDefault(); void run(async () => { await change({ data: { id: a.id, status: 'Reschedule requested', preferredDate: rDate, preferredTime: rTime } }); setRequest(null); }, 'Reschedule request sent. Your original appointment time has not changed.'); }}>
              <input className="ws-input" type="date" required value={rDate} onChange={e => setRDate(e.target.value)} aria-label="Preferred date" />
              <input className="ws-input" type="time" required value={rTime} onChange={e => setRTime(e.target.value)} aria-label="Preferred time" />
              <Button type="submit" disabled={busy}>Send</Button><Button type="button" variant="ghost" onClick={() => setRequest(null)}>Cancel</Button>
            </form> : <div className="nv-card-actions">
              {l['mode']==='online'&&!closed.includes(a.status)&&<><Button variant="outline" onClick={()=>setMeeting(a.id)} disabled={online.data?.find(x=>x.appointment_id===a.id)?.status!=='ready'}><Video/>Join online</Button><Button variant="ghost" size="icon-sm" aria-label="Share appointment link" onClick={()=>void navigator.clipboard.writeText(`${window.location.origin}/${role==='care-team'?'caregiver':'care-team'}/milan?appointment=${a.id}`)}><Paperclip/></Button></>}
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

/* ---------------- Lekha ---------------- */
export function LekhaWorkspace({ data, busy, run }: { data: Data; busy: boolean; run: Run }) {
  const [search,setSearch]=useState('');
  const [tab, setTab] = useState('pending'); const [openId, setOpenId] = useState<string | null>(null);
  const noteFor = (id: string) => data.notes.find(n => (n as { appointment_id?: string }).appointment_id === id) as (Data['notes'][number] & { observations: string; decision: string; follow_up: string; created_at: string }) | undefined;
  const completed = data.appointments.filter(a => a.status === 'Completed').sort((a, b) => b.starts_at.localeCompare(a.starts_at));
  const pending = completed.filter(a => !noteFor(a.id)); const done = completed.filter(a => noteFor(a.id));
  const open = completed.find(a => a.id === openId);
  if (open && !noteFor(open.id)) return <LekhaSession data={data} appt={open} busy={busy} run={run} onClose={() => setOpenId(null)} />;
  const list = (tab === 'pending' ? pending : done).filter(a=>{const b=data.babies.find(x=>x.id===a.baby_id);return `${b?.baby_name??''} ${b?.caregiver_name??''}`.toLowerCase().includes(search.toLowerCase());});
  return <>
    <WorkspaceHeading title="Lekha" description="Clinician-reviewed appointment documentation." />
    <div className="ws-bar"><SearchToggle label="Filter Lekha by baby" value={search} onChange={setSearch}><Toggle value={tab} onChange={setTab} options={[{ key: 'pending', label: 'Awaiting documentation', count: pending.length }, { key: 'done', label: 'Documented', count: done.length }]} /></SearchToggle></div>
    {!list.length ? <EmptyState>{tab === 'pending' ? 'No completed appointments are waiting for documentation. Mark an appointment as done in Milan.' : 'No documented appointments yet.'}</EmptyState> :
      <div className="ws-grid">{list.map(a => { const b = data.babies.find(x => x.id === a.baby_id); const n = noteFor(a.id); return <CareTicket key={a.id} source="Lekha" title={b?.baby_name ?? 'Appointment'} subtitle={a.reason} date={fmt(a.starts_at)} card={n ? parseCard(n.observations) : null} stamp={n ? 'Reviewed' : null} stub={!n} fields={[{ label: 'Caregiver', value: b?.caregiver_name ?? '—' }, { label: 'Appointment', value: 'Completed' }, { label: 'Location', value: loc(a)['facilityName'] || 'Not configured' }]} action={{ label: 'Document', onClick: () => setOpenId(a.id) }}>
        {n?.follow_up && <p className="nv-sub">Follow-up · {n.follow_up}</p>}
      </CareTicket>; })}</div>}

  </>;
}

type Msg = { role: 'user' | 'assistant'; content: string; chips?: string[] };
const LEKHA_PHASES = ['Reading your appointment notes', 'Matching details to the documentation topics', 'Structuring findings into clear sections', 'Laying out the Appointment Health Card'];
function LekhaSession({ data, appt, busy, run, onClose }: { data: Data; appt: Appointment; busy: boolean; run: Run; onClose: () => void }) {
  const save = useServerFn(saveClinicalNote); const baby = data.babies.find(b => b.id === appt.baby_id);
  const greeting: Msg = { role: 'assistant', content: `Hi, let's document the appointment for ${baby?.baby_name ?? 'this baby'} — ${appt.reason}, ${fmtDay(appt.starts_at)}. Just tell me what happened, in any language you're comfortable with. I'll tick the topics you cover on the right, structure everything into a Health Card, and you review it before it's saved.` };
  const [msgs, setMsgs] = useState<Msg[]>([greeting]); const [draft, setDraft] = useState(''); const [files, setFiles] = useState<File[]>([]);
  const [stage, setStage] = useState<'chat' | 'generating' | 'review' | 'done'>('chat');
  const [card, setCard] = useState<CareCard | null>(null); const [approved, setApproved] = useState(false);
  const speech = useSpeech(setDraft, draft); const organise = useServerFn(structureLekhaNote); const [aiNote, setAiNote] = useState(''); const fileRef = useRef<HTMLInputElement>(null);
  const getTranscript=useServerFn(getAppointmentTranscript);
  useEffect(()=>{if(loc(appt)['mode']!=='online')return;void getTranscript({data:{id:appt.id}}).then(text=>{if(text)setDraft(text);}).catch(e=>setAiNote(e instanceof Error?e.message:'Transcript unavailable.'));},[appt.id]);
  const said = msgs.filter(m => m.role === 'user').map(m => m.content).join('\n');
  const covered = detectChecklist(said + ' ' + draft, files.length);
  const total = lekhaChecklist.length;
  function send() {
    const t = draft.trim(); if (!t) return; if (speech.listening) speech.toggle();
    const next = [...msgs, { role: 'user', content: t } as Msg];
    const coveredNow = detectChecklist(next.filter(m => m.role === 'user').map(m => m.content).join('\n'), files.length);
    next.push({ role: 'assistant', content: `Got it — I've captured that. You've covered ${coveredNow.size} of ${total} documentation topics. Would you like to add anything else, attach a file, or shall I prepare the structured Health Card now?`, chips: ['create'] });
    setMsgs(next); setDraft('');
  }
  function generate() {
    setStage('generating'); setAiNote('');
    const started = Date.now();
    void organise({ data: { appointmentId: appt.id, note: said + (files.length ? `\nAttached: ${files.map(x => x.name).join(', ')}` : ''), checklist: lekhaChecklist.map(i => ({ key: i.key, title: i.title })) } })
      .then(async d => { await new Promise(ok => setTimeout(ok, Math.max(0, 5200 - (Date.now() - started)))); setCard(d); setApproved(false); setStage('review'); })
      .catch(e => { setStage('chat'); setAiNote(e instanceof Error ? e.message : 'Lekha could not organise the note.'); });
  }
  if (stage === 'generating') return <CardGeneration assistant="lekha" title="Lekha is preparing the Health Card" phases={LEKHA_PHASES} />;
  if (stage === 'done') return <div className="card-generation"><AssistantCharacter name="lekha" /><div className="svara-success-mark"><Check /></div><h1 className="svara-title">Appointment documented</h1><p className="svara-lede">The Appointment Health Card is saved to {baby?.baby_name ?? 'the baby'}'s care journey in Sutra.</p><Button onClick={onClose}>Back to Lekha<ArrowRight /></Button></div>;
  return <>
    <WorkspaceHeading title="Lekha" description="Clinician-reviewed appointment documentation." /><div className="flex items-center justify-between mb-3"><Button variant="ghost" onClick={onClose}><ArrowLeft />Appointments</Button><span className="nv-pill">{stage === 'review' ? 'Review' : 'In progress'}</span></div>
    {stage === 'review' ? <form className="lekha-review-stage" onSubmit={e => { e.preventDefault(); if (!card) return; void run(async () => { await save({ data: { appointmentId: appt.id, observations: JSON.stringify(card), decision: cardText(card), followUp: card.topics.find(t => /follow/i.test(t.title))?.finding ?? '', additionalNote: files.map(x => x.name).join(', ') } }); setStage('done'); }, 'Appointment Health Card saved to Sutra.'); }}>
      <CareTicket source="Lekha" title={baby?.baby_name ?? 'Appointment'} subtitle={appt.reason} date={fmtDay(appt.starts_at)} card={card} stamp={approved ? 'Reviewed' : null} stubLabel="Clinician review" action={{ label: 'Approve card', onClick: () => setApproved(true) }} />
      <div className="flex gap-2 justify-center"><Button type="button" variant="ghost" onClick={() => setStage('chat')}><ArrowLeft />Back to notes</Button><Button type="submit" disabled={busy || !approved}>Save to care journey</Button></div>
    </form> : <div className="lekha-doc">
      <section className="appointment-context">
        <div className="ws-panel-title"><CalendarDays /><div>Appointment</div></div>
        <div className="nv-row"><FileText /><div><strong>{appt.reason}</strong><small>Completed</small></div></div>
        <div className="nv-row"><CalendarDays /><div><strong>{fmtDay(appt.starts_at)}</strong><small>{fmtTime(appt.starts_at)} IST</small></div></div>
        <div className="nv-row"><User /><div><strong>{baby?.baby_name}</strong><small>Caregiver · {baby?.caregiver_name}</small></div></div>
        <div className="nv-row"><MapPin /><div><strong>{loc(appt)['facilityName'] || 'Location not set'}</strong><small>{loc(appt)['address'] || '—'}</small></div></div>
      </section>
      <section className="lekha-chat-col">
        <div className="chat-log lekha-log">
          {msgs.map((m, i) => <div key={i} className={`chat-bubble ${m.role === 'user' ? 'me' : 'bot'}`}>{m.content}{m.chips && i === msgs.length - 1 && <span className="lekha-chips"><Button type="button" size="sm" variant="outline" onClick={() => fileRef.current?.click()}><Paperclip />Attach file</Button><Button type="button" size="sm" onClick={generate}>Create the card<ArrowRight /></Button></span>}</div>)}
        </div>
        <input ref={fileRef} type="file" multiple hidden accept=".pdf,.jpg,.jpeg,.png" onChange={e => setFiles(x => [...x, ...Array.from(e.target.files ?? [])])} />
        {!!files.length && <div className="chat-tags">{files.map((x, i) => <span key={i}>{x.name}<button type="button" aria-label={`Remove ${x.name}`} onClick={() => setFiles(fs => fs.filter((_, j) => j !== i))}><X size={12} /></button></span>)}</div>}
        <div className="lekha-composer">
          <Button type="button" size="icon" variant="ghost" aria-label="Attach files" onClick={() => fileRef.current?.click()}><Plus /></Button>
          <textarea rows={1} value={draft} aria-label="Documentation notes" placeholder={speech.listening ? 'Recording… tap stop when done' : speech.processing ? 'Recognising speech…' : 'Type a message, or use voice…'} onChange={e => setDraft(e.target.value)} onKeyDown={e => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); send(); } }} />
          <Button type="button" size="icon" variant={speech.listening ? 'default' : 'ghost'} aria-label={speech.listening ? 'Stop voice input' : 'Speak'} onClick={speech.toggle}>{speech.listening ? <Square /> : <Mic />}</Button>
          <Button type="button" size="icon" aria-label="Send" onClick={send} disabled={!draft.trim()}><Send /></Button>
        </div>
        {speech.error && <p className="text-xs text-muted-foreground">{speech.error}</p>}
        {aiNote && <p className="text-xs text-muted-foreground" role="status">{aiNote}</p>}
        {said && <Button type="button" variant="outline" className="lekha-create" onClick={generate}>Done — create the Health Card<ArrowRight /></Button>}
      </section>
      <aside className="lekha-checklist">
        <div className="lekha-checklist-head"><h2>Visit checklist</h2><span>{covered.size} / {total} covered</span></div>
        <div className="lekha-checklist-bar"><span style={{ width: `${(covered.size / total) * 100}%` }} /></div>
        <ol>{lekhaChecklist.map((i, n) => <li key={i.key} className={covered.has(i.key) ? 'done' : ''}><span className="check-dot">{covered.has(i.key) && <Check size={12} />}</span><div><strong>{n + 1}. {i.title}</strong><small>{i.hint}</small></div></li>)}</ol>
      </aside>
    </div>}
  </>;
}

export { SutraWorkspace } from '@/components/sutra/workspace';
