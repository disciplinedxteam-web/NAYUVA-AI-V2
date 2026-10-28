import { useEffect, useRef, useState } from 'react';
import { ArrowLeft, ArrowUp, Check, FileText, Loader2, Mic, Plus, RotateCcw, Save, Sparkles, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Mascot } from './mascot';
import { lekhaChecklist } from '@/lib/lekha-checklist';
import { lekhaReadyToSummarize } from '@/lib/lekha-domain';
import { sutraGreeting } from '@/lib/sutra-domain';
import { consultPanels, type ConsultPanel } from './consult-tools';
import { extractSutraAttachment } from '@/components/sutra/attachments';

export type LekhaBubble = { id: string; from: 'clinician' | 'lekha' | 'file'; text: string };
type Recorder = { listening: boolean; processing: boolean; error: string; start: () => Promise<void>; stop: () => Promise<boolean>; retry: () => Promise<void> };

/** Parses persisted after-visit notes into chat bubbles; each saved line is one committed message. */
export function notesToBubbles(notes: string): LekhaBubble[] {
  return notes.split('\n').map(l => l.trim()).filter(Boolean).map((l, i) => {
    const file = l.match(/^Attachment \((.+?)\):\s*(.*)$/);
    if (file) return { id: `n${i}`, from: 'file' as const, text: file[1] ?? 'Attachment' };
    return { id: `n${i}`, from: 'clinician' as const, text: l.replace(/^(Clinician|Conversation):\s*/, '') };
  });
}
export function clinicianWords(notes: string) {
  return notes.split('\n').filter(l => !l.startsWith('Attachment (')).join(' ').replace(/(Clinician|Conversation):/g, ' ').split(/\s+/).filter(Boolean).length;
}

export function LekhaAfterStudio({ babyName, caregiverName, reason, when, notes, covered, recorder, lekhaNotes, busy, error, onAppend, onDraft, onRestart, onSummarize, onBack, panel = null, onPanel }: {
  panel?: ConsultPanel | null; onPanel?: (p: ConsultPanel | null) => void;
  babyName: string; caregiverName: string; reason: string; when: string; notes: string; covered: Set<string>; recorder: Recorder; lekhaNotes: LekhaBubble[]; busy: boolean; error: string;
  onAppend: (line: string) => void; onDraft: () => void; onRestart: () => void; onSummarize: () => void; onBack: () => void;
}) {
  const [draft, setDraft] = useState(''), [greeting, setGreeting] = useState('Hello'), [reading, setReading] = useState(false), [fileError, setFileError] = useState(''), [confirmRestart, setConfirmRestart] = useState(false);
  const file = useRef<HTMLInputElement>(null), log = useRef<HTMLDivElement>(null);
  const bubbles = [...notesToBubbles(notes), ...lekhaNotes];
  const hasNotes = notes.trim().length > 0;
  const ready = lekhaReadyToSummarize(clinicianWords(notes), covered.size);
  const voice = recorder.listening || (recorder.processing && !recorder.error);
  useEffect(() => setGreeting(sutraGreeting(new Date().getHours())), []);
  useEffect(() => { log.current?.scrollTo({ top: log.current.scrollHeight, behavior: 'smooth' }); }, [bubbles.length, recorder.processing]);
  function send() { const t = draft.replace(/\s+/g, ' ').trim(); if (!t) return; onAppend(`Clinician: ${t}`); setDraft(''); }
  async function attach(list: FileList | null) {
    const f = list?.[0]; if (!f) return; setReading(true); setFileError('');
    try { const a = await extractSutraAttachment(f); if (a.preview) URL.revokeObjectURL(a.preview); onAppend(`Attachment (${a.name.replace(/[()\n]/g, ' ')}): ${a.text.replace(/\s+/g, ' ').slice(0, 3000)}`); }
    catch (e) { setFileError(e instanceof Error ? e.message : 'Could not read this file.'); } finally { setReading(false); }
  }
  const summarizeHint = ready ? 'Ready to summarise' : 'Share a little more to summarise';
  return <section className={`lekha-after ${bubbles.length ? 'has-chat' : 'is-empty'}`} aria-label={`Document ${babyName}'s visit`}>
    <div className="lekha-after-top">
      <Button variant="ghost" size="sm" onClick={onBack} disabled={busy}><ArrowLeft />Appointments</Button>
      <div className="lekha-after-patient"><span>{babyName[0]}</span><div><strong>{babyName}</strong><small>{caregiverName} · {reason} · {when}</small></div></div>
    </div>

    {bubbles.length ? <div ref={log} className="lekha-after-log" aria-live="polite">
      {bubbles.map(b => <div key={b.id} className={`lekha-bubble is-${b.from}`}>{b.from === 'lekha' && <Mascot name="lekha" state="idle" size={28} />}{b.from === 'file' ? <p><FileText size={14} />{b.text}</p> : <p>{b.text}</p>}</div>)}
      {recorder.processing && <div className="lekha-bubble is-clinician is-pending"><p><i /><i /><i /></p></div>}
    </div> : <header className="sutra-greeting lekha-after-greeting">
      <Mascot name="lekha" state={voice ? 'working' : 'idle'} size={150} />
      <h1>{greeting}, <span>Dr. Ananya Rao<svg viewBox="0 0 160 18" preserveAspectRatio="none" aria-hidden="true"><path d="M4 9 Q80 21 156 8" /></svg></span></h1>
      <p>Tell me what happened in the appointment. Speak or type — I’ll tick the checklist as you go.</p>
    </header>}

    <div className="lekha-after-dock">
      {voice ? <div className="lekha-voice-stage" role="group" aria-label="Voice documentation">
        <div className="lekha-wave" aria-hidden="true">{Array.from({ length: 28 }, (_, i) => <i key={i} style={{ animationDelay: `${(i % 7) * -0.13}s` }} />)}</div>
        <p role="status">{recorder.listening ? 'Listening — speak in any language' : 'Saving the last words…'}</p>
        <div className="lekha-voice-controls">
          <Button variant="outline" size="sm" disabled={busy} onClick={onDraft}><Save />Draft</Button>
          <Button variant="outline" size="sm" disabled={busy} onClick={() => setConfirmRestart(true)}><RotateCcw />Restart</Button>
          <Button size="sm" disabled={busy || !ready} title={summarizeHint} onClick={onSummarize}><Sparkles />Summarise</Button>
        </div>
      </div> : <form className="sutra-reference-composer lekha-composer" onSubmit={e => { e.preventDefault(); send(); }} onDragOver={e => e.preventDefault()} onDrop={e => { e.preventDefault(); void attach(e.dataTransfer.files); }}>
        <textarea rows={2} maxLength={1500} aria-label="Type your visit notes" placeholder="Type a short note, e.g. weight 3.4 kg, feeding well…" value={draft} disabled={busy} onChange={e => setDraft(e.target.value)} onKeyDown={e => { if (e.key === 'Enter' && !e.shiftKey && !e.nativeEvent.isComposing) { e.preventDefault(); send(); } }} />
        <div className="sutra-reference-tools">
          <div className="sutra-left-tools">
            <Button type="button" variant="ghost" size="icon-sm" title="Attach a report or photo" aria-label="Attach a report or photo" disabled={busy || reading} onClick={() => file.current?.click()}>{reading ? <Loader2 className="animate-spin" /> : <Plus />}</Button>
            <Button type="button" variant="ghost" size="sm" className={hasNotes ? 'lekha-resume' : ''} disabled={busy} aria-label={hasNotes ? 'Resume speaking' : 'Speak your notes'} onClick={() => void recorder.start()}><Mic />{hasNotes ? 'Resume' : 'Speak'}</Button>
            {onPanel && consultPanels.map(x => <Button key={x.key} type="button" variant="ghost" size="icon-sm" title={x.label} aria-label={x.label} aria-pressed={panel === x.key} className={panel === x.key ? 'is-on' : ''} onClick={() => onPanel(panel === x.key ? null : x.key)}><x.icon /></Button>)}
            {hasNotes && <Button type="button" variant="ghost" size="icon-sm" title="Restart documentation" aria-label="Restart documentation" disabled={busy} onClick={() => setConfirmRestart(true)}><RotateCcw /></Button>}
          </div>
          <div className="sutra-right-tools">
            {hasNotes && <Button type="button" variant="outline" size="sm" disabled={busy || !ready} title={summarizeHint} onClick={onSummarize}><Sparkles />Summarise</Button>}
            <Button type="submit" size="icon-sm" aria-label="Add note" disabled={busy || !draft.trim()}><ArrowUp /></Button>
          </div>
        </div>
        <input hidden ref={file} type="file" accept="image/*,.pdf,.docx,.txt,.md,.csv" onChange={e => { void attach(e.target.files); e.target.value = ''; }} />
      </form>}

      {confirmRestart && <div className="lekha-restart" role="alertdialog" aria-label="Restart documentation"><p>Clear everything said so far and start again?</p><Button size="sm" variant="ghost" onClick={() => setConfirmRestart(false)}><X />Keep</Button><Button size="sm" variant="destructive" onClick={() => { setConfirmRestart(false); onRestart(); }}><RotateCcw />Restart</Button></div>}
      {(error || recorder.error || fileError) && <div className="lekha-after-alert" role="alert"><p>{error || recorder.error || fileError}</p>{recorder.error && <Button size="sm" variant="outline" disabled={recorder.processing} onClick={() => void recorder.retry()}>Retry audio</Button>}</div>}

      <div className="lekha-ribbon" aria-label={`Recommended topics, ${covered.size} of 8 covered`}>
        <div className="lekha-ribbon-head"><strong>Best-practice checklist</strong><span>Recommended, not required · {covered.size}/8</span></div>
        <ol>{lekhaChecklist.map((item, i) => { const on = covered.has(item.key); return <li key={item.key} className={on ? 'on' : ''}><span className="lekha-ribbon-dot">{on ? <Check size={11} strokeWidth={3} /> : i + 1}</span><strong>{item.label}</strong><small>{item.short}</small></li>; })}</ol>
      </div>
    </div>
  </section>;
}
