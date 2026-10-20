import { Scheduler } from './appointment-scheduler';
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

export { Scheduler, ProfileSearch } from './appointment-scheduler';

export { LekhaWorkspace } from './lekha-workspace';

export { SutraWorkspace } from '@/components/sutra/workspace';
