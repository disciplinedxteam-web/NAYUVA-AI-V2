import { useEffect, useRef, useState } from 'react';
import { useServerFn } from '@tanstack/react-start';
import { CalendarDays, Check, ChevronDown, FileText, Mic, Pause, Play, ArrowLeft, ArrowRight, MessageCircle, X, Send, Loader2, Sparkles, Trash2, RotateCcw, ClipboardList } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { SearchToggle } from '@/components/ui/search-toggle';
import { GlassToggle } from '@/components/ui/glass-toggle';
import { CareTicket } from './care-ticket';
import { Mascot } from './mascot';
import { CardGeneration } from './card-generation';
import { WorkspaceHeading } from './workspace-heading';
import { CarePlanForm } from './care-plan-form';
import { Scheduler } from './appointment-scheduler';
import { LekhaAfterStudio, type LekhaBubble } from './lekha-after-studio';
import { LekhaDocument } from './lekha-document';
import { ConsultToolsPanel } from './consult-tools';
import { MessageResponse } from '@/components/ai-elements/message';
import { useLekhaRecording } from './use-lekha-recording';
import { getCareData, getLekhaCapture, startLekhaCapture, saveLekhaProgress, generateLekhaDraft, approveLekhaDraft, savePlan, askSutra } from '@/lib/care.functions';
import { canStartLekhaMode, isOnlineAppointment, lekhaEligible, lekhaLiveTooShort } from '@/lib/lekha-domain';
import { detectChecklist } from '@/lib/lekha-checklist';
import { careCardSchema, parseCard, type CareCard } from '@/lib/care-card';
import type { CarePlan } from '@/lib/care-domain';
type Data=Awaited<ReturnType<typeof getCareData>>;type Appointment=Data['appointments'][number];type Run=(action:()=>Promise<unknown>,message:string)=>Promise<void>;
type Capture=Awaited<ReturnType<typeof startLekhaCapture>>;
type Panel='plan'|'sutra'|'milan';
const fmt=(v:string)=>new Date(v).toLocaleString('en-IN',{timeZone:'Asia/Kolkata',day:'numeric',month:'short',hour:'2-digit',minute:'2-digit'});
/** Counts spoken words, ignoring the speaker label prefix stored on each line. */
const spokenWords=(notes:string)=>notes.replace(/^[^:\n]{1,24}:\s*/gm,'').split(/\s+/).filter(Boolean).length;
export function LekhaWorkspace({data,busy,run,onFocus}:{data:Data;busy:boolean;run:Run;onFocus:(focused:boolean)=>void}){
 const [tab,setTab]=useState('pending'),[search,setSearch]=useState(''),[id,setId]=useState('');
 useEffect(()=>{const handoff=sessionStorage.getItem('lekha-appointment');if(handoff){sessionStorage.removeItem('lekha-appointment');setId(handoff);}},[]);
 const documented=(id:string)=>data.notes.find(n=>n.appointment_id===id);
 const offline=data.appointments.filter(a=>!isOnlineAppointment(a));const pending=offline.filter(a=>lekhaEligible(a)&&!documented(a.id)),done=offline.filter(a=>documented(a.id));
 const appointment=offline.find(a=>a.id===id);
 useEffect(()=>{onFocus(!!appointment&&!documented(id));return()=>onFocus(false);},[id,!!appointment,!!documented(id)]);
 if(appointment&&!documented(id))return <LekhaSession key={id} data={data} appt={appointment} busy={busy} run={run} onClose={()=>setId('')}/>;
 const rows=(tab==='pending'?pending:done).filter(a=>{const b=data.babies.find(b=>b.id===a.baby_id);return `${b?.baby_name} ${b?.caregiver_name}`.toLowerCase().includes(search.toLowerCase());}).sort((a,b)=>b.starts_at.localeCompare(a.starts_at));
 return <><WorkspaceHeading title="Lekha" description="In-person visits and clinician-reviewed documentation."/><div className="ws-bar"><SearchToggle label="Filter Lekha by baby" value={search} onChange={setSearch}><GlassToggle value={tab} onChange={setTab} options={[{key:'pending',label:'Awaiting documentation',count:pending.length},{key:'done',label:'Documented',count:done.length}]}/></SearchToggle></div><div className="ws-grid">{rows.map(a=>{const b=data.babies.find(b=>b.id===a.baby_id),n=documented(a.id);return <CareTicket key={a.id} source="Lekha" title={b?.baby_name??'Appointment'} subtitle={a.reason} date={fmt(a.starts_at)} card={n?parseCard(n.observations):null} stamp={n?'Reviewed':null} stub={!n} fields={[{label:'Caregiver',value:b?.caregiver_name??'—'},{label:'Appointment',value:a.status},{label:'Mode',value:'In-person'}]} {...(!n?{action:{label:'Document',onClick:()=>setId(a.id)}}:{})}/>;})}</div>{!rows.length&&<p className="care-empty">{tab==='pending'?'No in-person visits awaiting documentation.':'No documented appointments yet.'}</p>}</>;
}
function LekhaSession({data,appt,busy,run,onClose}:{data:Data;appt:Appointment;busy:boolean;run:Run;onClose:()=>void}){
 const get=useServerFn(getLekhaCapture),start=useServerFn(startLekhaCapture),save=useServerFn(saveLekhaProgress),generate=useServerFn(generateLekhaDraft),approve=useServerFn(approveLekhaDraft);
 const baby=data.babies.find(b=>b.id===appt.baby_id);
 const [capture,setCapture]=useState<Capture|null>(null),[notes,setNotes]=useState(''),[stage,setStage]=useState<'choose'|'capture'|'short'|'generating'|'review'|'done'>('choose');
 const [mode,setMode]=useState<'live'|'after'|null>(null),[tray,setTray]=useState<'live'|'after'|null>(null),[consent,setConsent]=useState(false),[localBusy,setLocalBusy]=useState(false),[error,setError]=useState(''),[card,setCard]=useState<CareCard|null>(null),[panel,setPanel]=useState<Panel|null>(null),[confirmDiscard,setConfirmDiscard]=useState(false),[lekhaNotes,setLekhaNotes]=useState<LekhaBubble[]>([]);
 const saveQueue=useRef<Promise<unknown>>(Promise.resolve());const notesRef=useRef(notes);notesRef.current=notes;const captureRef=useRef(capture);captureRef.current=capture;
 const recorder=useLekhaRecording(appt.id,s=>{setNotes(old=>`${old}${old?'\n':''}${s.speaker}: ${s.content}`.slice(0,12000));});
 useEffect(()=>{void get({data:{appointmentId:appt.id}}).then(r=>{if(!r.capture)return;setCapture(r.capture);setMode(r.capture.mode as 'live'|'after');setNotes(r.capture.edited_notes);if(r.capture.status==='approved'){setStage('done');return;}if(r.capture.status==='review'){const c=careCardSchema.safeParse(r.capture.draft_card);if(c.success){setCard(c.data);setStage('review');return;}}if(r.capture.mode==='after')setStage('capture');}).catch(e=>setError(e.message));},[appt.id]);
 useEffect(()=>{if(!capture||stage!=='capture'||capture.status==='ended'||localBusy)return;const t=window.setTimeout(()=>{if(notes!==capture.edited_notes)void persist(capture.status==='paused'?'paused':'capturing').catch(e=>setError(e.message));},1800);return()=>clearTimeout(t);},[notes,capture,stage,localBusy]);
 async function persist(status:'capturing'|'paused'|'ended') {const task=saveQueue.current.catch(()=>{}).then(async()=>{const c=captureRef.current;if(!c)throw new Error('Capture unavailable.');const r=await save({data:{appointmentId:appt.id,notes:notesRef.current,revision:c.revision,status}});captureRef.current=r;setCapture(r);return r;});saveQueue.current=task;return task;}
 async function begin(m:'live'|'after'){setLocalBusy(true);setError('');try{const c=await start({data:{appointmentId:appt.id,mode:m,consent:true}});setCapture(c);captureRef.current=c;setMode(m);setStage('capture');if(m==='live'){if(c.status==='paused'||c.status==='ended')await persist('capturing');await recorder.start();}}catch(e){setError(e instanceof Error?e.message:'Capture unavailable.');}finally{setLocalBusy(false);}}
 async function togglePause(){setLocalBusy(true);setError('');try{if(recorder.listening){await recorder.stop();await persist('paused');}else{await persist('capturing');await recorder.start();}}catch(e){setError(e instanceof Error?e.message:'Could not change recording.');}finally{setLocalBusy(false);}}
 async function leave(){if(capture&&stage==='capture'){setLocalBusy(true);try{await recorder.stop();if(recorder.hasPending())throw new Error('Untranscribed audio is retained on this page. Retry before leaving.');if(capture.status!=='ended')await persist('paused');onClose();}catch(e){setError(e instanceof Error?e.message:'Notes could not be saved.');}finally{setLocalBusy(false);}}else onClose();}
 const say=(text:string)=>setLekhaNotes(m=>[...m,{id:crypto.randomUUID(),from:'lekha',text}]);
 function append(line:string){const next=`${notesRef.current}${notesRef.current?'\n':''}${line}`.slice(0,12000);notesRef.current=next;setNotes(next);}
 async function draftSave(){setLocalBusy(true);setError('');try{await recorder.stop();await persist('paused');say('Saved as draft. You can keep typing, or resume speaking whenever you’re ready.');}catch(e){setError(e instanceof Error?e.message:'Draft could not be saved.');}finally{setLocalBusy(false);}}
 async function clearNotes(){await recorder.stop();notesRef.current='';setNotes('');setLekhaNotes([]);await persist('paused');}
 async function restart(){setLocalBusy(true);setError('');try{await clearNotes();}catch(e){setError(e instanceof Error?e.message:'Could not restart.');}finally{setLocalBusy(false);}}
 async function produce(){await persist('ended');setStage('generating');const c=await generate({data:{appointmentId:appt.id}});setCard(c);setLekhaNotes([]);setStage('review');}
 async function summarize(){setLocalBusy(true);setError('');try{const complete=await recorder.stop();if(!complete)throw new Error('Some audio could not be transcribed. Retry the audio, or restart and record again.');await persist('ended');say('Noted, doctor. I’ll document everything we discussed.');await new Promise(res=>setTimeout(res,1100));await produce();}catch(e){setStage('capture');setError(e instanceof Error?e.message:'The document could not be prepared. Please try again.');}finally{setLocalBusy(false);}}
 async function summarizeLive(){setLocalBusy(true);setError('');try{const complete=await recorder.stop();if(!complete)throw new Error('Some audio could not be transcribed. Retry the saved audio before summarising.');if(lekhaLiveTooShort(spokenWords(notesRef.current))){await persist('paused');setPanel(null);setStage('short');return;}await produce();}catch(e){setStage('capture');setError(e instanceof Error?e.message:'The document could not be prepared. Please try again.');}finally{setLocalBusy(false);}}
 async function retryLive(){setLocalBusy(true);setError('');try{await clearNotes();await persist('capturing');setStage('capture');await recorder.start();}catch(e){setError(e instanceof Error?e.message:'Could not restart recording.');}finally{setLocalBusy(false);}}
 async function switchToAfter(){setLocalBusy(true);setError('');try{await clearNotes();setMode('after');setStage('capture');}catch(e){setError(e instanceof Error?e.message:'Could not switch.');}finally{setLocalBusy(false);}}
 async function discard(){setLocalBusy(true);setError('');try{await clearNotes();setConfirmDiscard(false);setPanel(null);setStage('choose');setTray(null);setConsent(false);}catch(e){setError(e instanceof Error?e.message:'Could not discard.');}finally{setLocalBusy(false);}}
 const covered=detectChecklist(notes,0);
 const alert=(error||recorder.error)&&<div role="alert" className="lekha-alert"><p>{error||recorder.error}</p>{recorder.error&&<Button variant="outline" size="sm" disabled={recorder.processing} onClick={()=>void recorder.retry()}>Retry saved audio</Button>}</div>;
 if(stage==='generating')return <CardGeneration assistant="lekha" title="Preparing your encounter document" phases={['Understanding who said what in the consultation','Extracting complaints, findings and decisions','Formatting tests, medicines and caregiver guidance','Compiling your A4 encounter sheets']}/>;
 if(stage==='capture'&&mode==='after'&&baby)return <div className={`lekha-after-split ${panel?'is-split':''}`}><LekhaAfterStudio panel={panel} onPanel={setPanel} babyName={baby.baby_name} caregiverName={baby.caregiver_name} reason={appt.reason} when={fmt(appt.starts_at)} notes={notes} covered={covered} recorder={recorder} lekhaNotes={lekhaNotes} busy={localBusy} error={error} onAppend={append} onDraft={()=>void draftSave()} onRestart={()=>void restart()} onSummarize={()=>void summarize()} onBack={()=>void leave()}/>{panel&&<ConsultToolsPanel panel={panel} data={data} babyId={appt.baby_id} busy={busy} run={run} note="Your notes stay open" onClose={()=>setPanel(null)}/>}</div>;
 if(stage==='review'&&card&&baby){const plan=baby.plan as unknown as Partial<CarePlan>;return <section className="lekha-review-studio"><div className="lekha-after-top"><Button variant="ghost" size="sm" onClick={onClose}><ArrowLeft/>Appointments</Button><span className="bento-pill">Clinician review · Edit, then approve & sign</span></div><LekhaDocument meta={{babyName:baby.baby_name,caregiverName:baby.caregiver_name,dob:plan.dob,gestation:plan.gestationalAge,reason:appt.reason,when:fmt(appt.starts_at),clinician:'Dr. Ananya Rao'}} card={card} approved={false} busy={busy} onEdit={(i,v)=>setCard(c=>c?{...c,topics:c.topics.map((t,j)=>j===i?{...t,finding:v}:t)}:c)} onApprove={()=>void run(async()=>{await approve({data:{appointmentId:appt.id,card,approved:true}});setStage('done');},'Encounter documented and signed.')}/>{error&&<div role="alert" className="lekha-alert"><p>{error}</p></div>}</section>;}
 if(stage==='done')return <div className="lekha-complete"><Mascot name="lekha" state="working" size={180}/><Check/><h1>Your documentation is complete</h1><p>Encounter signed and saved to Sutra. A caregiver-friendly copy has been sent to {baby?.caregiver_name}’s dashboard.</p><Button onClick={onClose}>Back to Lekha<ArrowRight/></Button></div>;
 if(stage==='short')return <section className="lekha-studio"><div className="lekha-top"><Button variant="ghost" onClick={onClose}><ArrowLeft/>Appointments</Button><span className="bento-pill">Recording too short</span></div><div className="lekha-choice"><Mascot name="lekha" state="idle" size={170}/><h1>I couldn’t hear enough to document</h1><p>The recording ended too early or the microphone picked up very little. No document was created.</p><div className="lekha-short-actions"><Button disabled={localBusy} onClick={()=>void retryLive()}>{localBusy?<Loader2 className="animate-spin"/>:<RotateCcw/>}Retry live recording</Button><Button variant="outline" disabled={localBusy} onClick={()=>void switchToAfter()}><FileText/>Switch to after-visit notes</Button></div></div>{alert}</section>;
 if(stage==='capture'&&mode==='live'){
  const listening=recorder.listening,paused=!listening&&!recorder.processing;
  const panels=[{key:'plan',label:'Care Plan',icon:ClipboardList},{key:'sutra',label:'Ask Sutra',icon:MessageCircle},{key:'milan',label:'Schedule follow-up',icon:CalendarDays}] as const;
  return <section className={`lekha-live ${panel?'is-split':''}`} aria-label="Live appointment recording">
   <div className="lekha-live-stage">
    <div className="lekha-top"><Button variant="ghost" onClick={()=>void leave()} disabled={localBusy}><ArrowLeft/>Appointments</Button><span className={`lekha-live-pill ${listening?'is-on':''}`}><i/>{recorder.processing&&!listening?'Saving audio…':listening?'Recording':'Paused'}</span></div>
    <div className="lekha-live-center">
     <p className="lekha-live-who">{baby?.baby_name} · {baby?.caregiver_name} · {appt.reason}</p>
     <Mascot name="lekha" state={listening?'working':'idle'} size={panel?150:190}/>
     <div className={`lekha-wave ${listening?'is-on':''}`} aria-hidden="true">{Array.from({length:13},(_,i)=><span key={i} style={{animationDelay:`${(i%7)*0.11}s`}}/>)}</div>
     <h1>{listening?'Listening to your consultation':'Recording paused'}</h1>
     <p>Speak naturally with the caregiver. Lekha understands who said what and organises it into an A4 encounter document when you finish.</p>
     <div className="lekha-live-controls">
      <Button variant="outline" disabled={localBusy} onClick={()=>void togglePause()}>{paused?<Play/>:<Pause/>}{paused?'Resume':'Pause'}</Button>
      <Button className="lekha-live-end" disabled={localBusy} onClick={()=>void summarizeLive()}>{localBusy?<Loader2 className="animate-spin"/>:<Sparkles/>}End & Summarise</Button>
      {confirmDiscard?<><Button variant="ghost" className="lekha-live-discard" disabled={localBusy} onClick={()=>void discard()}><Trash2/>Confirm discard</Button><Button variant="ghost" size="icon" aria-label="Keep recording" onClick={()=>setConfirmDiscard(false)}><X/></Button></>:<Button variant="ghost" disabled={localBusy} onClick={()=>setConfirmDiscard(true)}><Trash2/>Discard</Button>}
     </div>
     {alert}
    </div>
   </div>
   {panel&&baby&&<ConsultToolsPanel panel={panel} data={data} babyId={appt.baby_id} busy={busy} run={run} note="Recording continues while you work" onClose={()=>setPanel(null)}/>}
   <nav className="lekha-live-rail" aria-label="Appointment quick actions">{panels.map(x=><Button key={x.key} variant="ghost" size="icon" title={x.label} aria-label={x.label} aria-pressed={panel===x.key} className={panel===x.key?'is-on':''} onClick={()=>setPanel(panel===x.key?null:x.key)}><x.icon/></Button>)}</nav>
  </section>;
 }
 return <section className="lekha-studio"><div className="lekha-top"><Button variant="ghost" onClick={()=>void leave()} disabled={localBusy}><ArrowLeft/>Appointments</Button><span className="bento-pill">Choose documentation</span></div>
  <div className="lekha-choice"><Mascot name="lekha" state="idle" size={190}/><h1>Let’s document this visit</h1><p>{baby?.baby_name} · {appt.reason} · {fmt(appt.starts_at)}</p><div className="svara-ctas">{([{key:'live',title:'During appointment',sub:'Record the consultation',icon:Mic},{key:'after',title:'After appointment',sub:'Speak or type your visit notes',icon:FileText}] as const).map(x=><div key={x.key} className={`svara-cta-group ${tray===x.key?'open':''}`}><Button variant="ghost" className={`svara-cta ${x.key==='live'?'primary':''}`} aria-expanded={tray===x.key} onClick={()=>{setTray(tray===x.key?null:x.key);setConsent(false);}}><x.icon/><span><strong>{x.title}</strong><small>{x.sub}</small></span><ChevronDown className="chev"/></Button>{tray===x.key&&<div className="svara-tray"><p>{x.key==='live'?'Lekha records the room conversation and, when you finish, organises it into a clinical document for your review.':'Speak or type what happened, in any language. Lekha ticks a best-practice checklist as you go.'}</p><label className="svara-consent"><input type="checkbox" checked={consent} onChange={e=>setConsent(e.target.checked)}/><span>{x.key==='live'?'All participants agree to the conversation being recorded and transcribed.':'I agree to transcription and storage of these visit notes.'}</span></label><Button className="w-full" disabled={!consent||localBusy||!canStartLekhaMode(appt,x.key)} onClick={()=>void begin(x.key)}>{localBusy?<Loader2 className="animate-spin"/>:<x.icon/>}{x.key==='live'?'Start recording':'Start documentation'}</Button></div>}</div>)}</div></div>
  {alert}
 </section>;
}
