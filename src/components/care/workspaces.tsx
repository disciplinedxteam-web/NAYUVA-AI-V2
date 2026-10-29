import { Scheduler } from './appointment-scheduler';
import { SearchToggle } from '@/components/ui/search-toggle';
import { CareTicket } from './care-ticket';
import { DocumentActions } from './document-actions';
import { caregiverStatus } from './lekha-workspace';
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
import { useEffect, useMemo, useRef, useState, type ReactNode } from 'react';
import { RescheduleDialog } from './reschedule-dialog';
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
export function MilanWorkspace({ data, role, busy, run, onDocument }: { data: Data; role: DemoRole; busy: boolean; run: Run; onDocument: (id?: string) => void }) {
  const change = useServerFn(updateAppointment);
  const [search,setSearch]=useState(''),[meeting,setMeeting]=useState('');
  const getOnline=useServerFn(getOnlineAppointments);const online=useQuery({queryKey:['online-appointments',role],queryFn:getOnline,refetchInterval:60_000});
  const [tab, setTab] = useState('upcoming'); const [scheduling, setScheduling] = useState(false); const [request, setRequest] = useState<Appointment | null>(null);
  const isPast = (a: Appointment) => closed.includes(a.status) || (a.status !== 'Reschedule requested' && new Date(a.ends_at ?? a.starts_at).getTime() < Date.now());
  const isRequest = (a: Appointment) => a.status === 'Reschedule requested' && !closed.includes(a.status);
  const requests = role === 'care-team' ? data.appointments.filter(isRequest).sort((a, b) => a.starts_at.localeCompare(b.starts_at)) : [];
  const upcoming = data.appointments.filter(a => !isPast(a) && !(role === 'care-team' && isRequest(a))).sort((a, b) => a.starts_at.localeCompare(b.starts_at));
  const past = data.appointments.filter(a => isPast(a) && !(role === 'care-team' && isRequest(a))).sort((a, b) => b.starts_at.localeCompare(a.starts_at));
  const source = tab === 'requests' ? requests : tab === 'past' ? past : upcoming;
  const list = source.filter(a=>{const b=data.babies.find(x=>x.id===a.baby_id);return `${b?.baby_name??''} ${b?.caregiver_name??''}`.toLowerCase().includes(search.toLowerCase());});
  const babyOf = (id: string) => data.babies.find(b => b.id === id);
  const tabs = [{ key: 'upcoming', label: 'Upcoming', count: upcoming.length }, ...(role === 'care-team' ? [{ key: 'requests', label: 'Reschedule requests', count: requests.length }] : []), { key: 'past', label: 'Past', count: past.length }];
  if(meeting)return <OnlineMeeting id={meeting} onClose={()=>setMeeting('')}/>;
  const reqBaby = request ? babyOf(request.baby_id) : undefined;
  return <>
    <WorkspaceHeading title="Milan" description="Appointments and coordinated follow-up care." />
    {scheduling ? <Scheduler data={data} busy={busy} run={run} onDone={() => setScheduling(false)} /> : <>
      <div className="ws-bar">
        <div className="ws-bar-cluster">
          <SearchToggle label="Filter Milan by baby" value={search} onChange={setSearch}><Toggle value={tab} onChange={setTab} options={tabs} /></SearchToggle>
          {role === 'care-team' && <Button className="ws-bar-action" onClick={() => setScheduling(true)} disabled={!data.babies.length}><Plus />Schedule Appointment</Button>}
        </div>
      </div>
      {!list.length ? <EmptyState>{tab === 'upcoming' ? 'No upcoming appointments.' : tab === 'requests' ? 'No reschedule requests waiting for review.' : 'No past appointments yet.'}</EmptyState> :
        <div className="ws-grid">{list.map(a => {
          const b = babyOf(a.baby_id); const l = loc(a); const resched = a.reschedule as { date: string; time: string; note?: string } | null;
          const documented = data.notes.some(n => (n as { appointment_id?: string }).appointment_id === a.id);
          const isOnline = l['mode'] === 'online'; const joinable = isOnline && !closed.includes(a.status) && online.data?.find(x=>x.appointment_id===a.id)?.status==='ready';
          const pending = a.status === 'Reschedule requested' && !!resched;
          const requested = pending ? new Date(`${resched.date}T${resched.time}:00+05:30`) : null;
          const reqLabel = requested ? `${requested.toLocaleDateString('en-IN',{day:'numeric',month:'short',...tz})}, ${requested.toLocaleTimeString('en-IN',{hour:'2-digit',minute:'2-digit',...tz})}` : '';
          const when = `${new Date(a.starts_at).toLocaleDateString('en-IN',{day:'numeric',month:'short',...tz})}, ${fmtTime(a.starts_at)}`;
          const status = pending ? `Requested ${reqLabel}` : documented ? 'Documented' : caregiverStatus(a.status);
          const fields = role === 'care-team'
            ? [{ label: 'Caregiver', value: b?.caregiver_name ?? '—' }, { label: 'Date & time', value: when }, { label: 'Status', value: status }]
            : [{ label: 'Doctor', value: 'Dr. Ananya Rao' }, { label: 'Date & time', value: when }, { label: 'Reason', value: a.reason }];
          const note = data.notes.find(n => n.appointment_id === a.id);
          const plan = (b?.plan ?? {}) as Record<string, string>;
          const docs = note ? <DocumentActions meta={{ kind: isOnline ? 'online' : 'encounter', babyName: b?.baby_name ?? 'Baby', caregiverName: b?.caregiver_name ?? '—', dob: plan['dob'], gestation: plan['gestationalAge'], reason: a.reason, when, clinician: 'Dr. Ananya Rao' }} card={parseCard(note.observations)} /> : null;
          const cta = (label: string, onClick: () => void, disabled = false) => <Button type="button" className="ticket-cta" disabled={disabled} onClick={onClick}>{label}<ArrowRight size={15} aria-hidden="true" /></Button>;
          let footer: ReactNode;
          if (role === 'care-team') {
            if (tab === 'requests' && pending) footer = <>{cta('Approve', () => void run(async () => { await change({ data: { id: a.id, status: 'Reschedule approved' } }); setTab('upcoming'); }, 'Reschedule approved. It is now in Upcoming.'), busy)}<Button type="button" variant="outline" className="ticket-cta-alt" disabled={busy} onClick={() => void run(async () => { await change({ data: { id: a.id, status: 'Reschedule declined' } }); setTab('upcoming'); }, 'Request declined. The original time is kept.')}>Decline</Button></>;
            else if (docs) footer = docs;
            else if (a.status === 'Completed') footer = isOnline ? <span className="ticket-foot-note">Online visit · awaiting document</span> : cta('Document in Lekha', () => onDocument(a.id));
            else if (a.status === 'Cancelled') footer = <span className="ticket-foot-note">Appointment cancelled</span>;
            else if (joinable) footer = <>{cta('Join online', () => setMeeting(a.id))}<Button type="button" variant="outline" size="icon" className="ticket-cta-icon" aria-label="Copy appointment link" onClick={()=>void navigator.clipboard.writeText(`${window.location.origin}/caregiver/milan?appointment=${a.id}`)}><Paperclip/></Button></>;
            else footer = <>{isOnline ? <span className="ticket-foot-note">Online room opening soon</span> : cta('Document in Lekha', () => onDocument(a.id))}<Button type="button" variant="outline" size="icon" className="ticket-cta-icon" aria-label="Cancel appointment" disabled={busy} onClick={() => void run(() => change({ data: { id: a.id, status: 'Cancelled' } }), 'Appointment cancelled.')}><X/></Button></>;
          } else {
            if (docs) footer = docs;
            else if (closed.includes(a.status) || isPast(a)) footer = <span className="ticket-foot-note">{a.status === 'Cancelled' ? 'Appointment cancelled' : 'Appointment completed'}</span>;
            else if (pending) footer = <Button type="button" className="ticket-cta" disabled>Awaiting care team review</Button>;
            else if (joinable) footer = <>{cta('Join online', () => setMeeting(a.id))}<Button type="button" variant="outline" className="ticket-cta-alt" onClick={() => setRequest(a)}>Reschedule</Button></>;
            else if (a.status === 'Confirmed') footer = <>{cta('Reschedule', () => setRequest(a))}</>;
            else footer = <>{cta('Confirm', () => void run(() => change({ data: { id: a.id, status: 'Confirmed' } }), 'Appointment confirmed.'), busy)}<Button type="button" variant="outline" className="ticket-cta-alt" onClick={() => setRequest(a)}>Reschedule</Button></>;
          }
          return <CareTicket key={a.id} variant="appointment" source="Milan" title={b?.baby_name ?? 'Appointment'} subtitle={isOnline ? 'Online video' : 'In-person'} stamp={null} fields={fields} footer={footer}>
            {tab === 'requests' && pending && resched.note ? <p className="ticket-note">“{resched.note}”</p> : null}
          </CareTicket>;
        })}</div>}
      <RescheduleDialog open={!!request} onOpenChange={v => { if (!v) setRequest(null); }} babyName={reqBaby?.baby_name ?? ''} currentStart={request?.starts_at ?? new Date().toISOString()} busy={busy}
        onSubmit={v => { const a = request; if (!a) return; void run(async () => { await change({ data: { id: a.id, status: 'Reschedule requested', preferredDate: v.date, preferredTime: v.time, note: v.note } }); setRequest(null); }, 'Reschedule request sent. Your original appointment time has not changed.'); }} />
    </>}
  </>;
}

export { Scheduler, ProfileSearch } from './appointment-scheduler';

export { LekhaWorkspace } from './lekha-workspace';

export { SutraWorkspace } from '@/components/sutra/workspace';
