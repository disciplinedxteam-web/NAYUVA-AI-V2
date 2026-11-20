import { CompletionScreen } from './completion-screen';
import { HaloNotification } from './halo-notification';
import { useCallback, useEffect, useRef, useState } from 'react';
import { useServerFn } from '@tanstack/react-start';
import { useNavigate } from '@tanstack/react-router';
import { Mic, Phone, Check, ChevronDown, Loader2, PhoneCall, RotateCcw } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { SvaraVoice, type Line } from './svara-voice';
import { LekhaDocument } from './lekha-document';
import { CardGeneration } from './card-generation';
import { SvaraAnimation } from './svara-animation';
import { DemoGuide, SecureNote } from './demo-guide';
import { parseCard } from '@/lib/care-card';
import { prepareSvaraSession, saveSvaraTranscript, saveSvaraPhone, summarizeSvaraSession, confirmSvaraSession, getSvaraCallStatus } from '@/lib/care.functions';

type Session = Awaited<ReturnType<typeof prepareSvaraSession>>;
type Stage = 'choose' | 'web' | 'phone' | 'generating' | 'review' | 'success';
const STEPS = ['Reading your conversation with Svara', 'Matching each answer to your Care Plan topics', 'Writing short, clear findings per topic', 'Suggesting a review category for your care team', 'Laying out your Health Card'];
const ACTIVE = ['initiating', 'call_placed', 'in_progress'];
const CALL_TEXT: Record<string, string> = { initiating: 'Placing your call…', call_placed: 'Your phone is ringing. Please answer to begin.', in_progress: "Thanks for picking up the call. I'll record everything that you say, just so I can convert it into a structured health card that can be sent to the care team.", completed: 'Call ended. Preparing your Health Card…', completed_no_transcript: 'The call ended too early, so no Health Card was created.', no_answer: 'The call was not answered.', busy: 'Your line was busy.', failed: 'The call could not be completed.' };
export const formatMobile = (d: string) => (d.length > 5 ? `${d.slice(0, 5)}-${d.slice(5)}` : d);

export function SvaraWorkspace({ due, onSaved }: { due: boolean; onSaved: () => void }) {
  const prepare = useServerFn(prepareSvaraSession), persist = useServerFn(saveSvaraTranscript), phoneSave = useServerFn(saveSvaraPhone), summarize = useServerFn(summarizeSvaraSession), confirm = useServerFn(confirmSvaraSession), callStatusFn = useServerFn(getSvaraCallStatus);
  const navigate = useNavigate();
  const [stage, setStage] = useState<Stage>('choose');
  const [open, setOpen] = useState<'web' | 'phone' | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [digits, setDigits] = useState(''), [consent, setConsent] = useState(false), [busy, setBusy] = useState(false), [error, setError] = useState('');
  const [summary, setSummary] = useState(''), [approved, setApproved] = useState(false), [call, setCall] = useState<string | null>(null);
  const lines = useRef<Line[]>([]);
  const [last, setLast] = useState<'web' | 'phone' | null>(null), [callSince, setCallSince] = useState(0), [tick, setTick] = useState(0);
  useEffect(() => { if (stage !== 'phone') return; const t = setInterval(() => setTick((n) => n + 1), 5000); return () => clearInterval(t); }, [stage]);

  // Resume a check-in that already has a draft card awaiting the caregiver.
  useEffect(() => { if (!due) return; void prepare({ data: { channel: 'website_voice' } }).then((s) => { const sm = (s.summary ?? {}) as Record<string, unknown>; if (s.context['check_in_status'] === 'awaiting_confirmation' && typeof sm['summary'] === 'string') { setSession(s); setSummary(sm['summary']); setStage('review'); } else if (s.phone) setDigits(s.phone.replace(/\D/g, '').slice(-10)); }).catch(() => {}); // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [due]);

  // Keep polling during the writing animation: the webhook prepares a draft, never sends it.
  useEffect(() => {
    if ((stage !== 'phone' && !(stage === 'generating' && last === 'phone')) || !session) return;
    let cancelled = false;
    let polling = false;
    const poll = async () => {
      if (polling) return;
      polling = true;
      try {
      const r = await callStatusFn({ data: { sessionId: session.sessionId } });
      if (cancelled) return;
      if (r.status === 'submitted') { onSaved(); setStage('success'); return; }
      setCall(r.callStatus);
      if (r.callStatus === 'completed_no_transcript') {
        setStage('choose'); setOpen('phone'); setError('Call ended too early. Try again.'); return;
      }
      if (r.callStatus === 'completed') {
        if (r.failure === 'summary_unavailable') { setStage('choose'); setOpen('phone'); setError('Your call ended, but the document could not be prepared. Please try again.'); return; }
        if (r.draft) { setSummary(r.draft); setApproved(false); setStage('review'); }
        else setStage('generating');
      }
      } catch { /* A transient status failure must not interrupt the call or draft. */ }
      finally { polling = false; }
    };
    void poll();
    const t = setInterval(() => { void poll(); }, 1000);
    return () => { cancelled = true; clearInterval(t); };
  }, [stage, session, last, callStatusFn, onSaved]);

  const onTranscript = useCallback((v: Line[]) => { lines.current = v; }, []);
  useEffect(() => { if (stage !== 'web' || !session) return; const t = setInterval(() => { if (lines.current.length) void persist({ data: { sessionId: session.sessionId, lines: lines.current } }).catch(() => {}); }, 5000); return () => clearInterval(t); }, [stage, session, persist]);

  async function startWeb() {
    setBusy(true); setError(''); setLast('web');
    try { const s = await prepare({ data: { channel: 'website_voice' } }); setSession(s); lines.current = []; setStage('web'); }
    catch (e) { setError(e instanceof Error ? e.message : 'Check-in unavailable.'); } finally { setBusy(false); }
  }
  async function startPhone() {
    setBusy(true); setError(''); setLast('phone');
    try { const s = await prepare({ data: { channel: 'phone' } }); setSession(s); const r = await phoneSave({ data: { sessionId: s.sessionId, phone: `+91${digits}`, consent: true } }); setCall(r.status); setCallSince(Date.now()); setStage('phone'); }
    catch (e) { setError(e instanceof Error ? e.message : 'The call could not be placed.'); } finally { setBusy(false); }
  }
  const onEnded = useCallback(() => { void (async () => {
    const s = session; if (!s) return;
    const transcript = lines.current;
    if (!transcript.some((l) => l.role === 'user')) { setStage('choose'); setError('No answers were recorded. Please start the check-in again when you are ready.'); return; }
    setStage('generating'); const started = Date.now();
    try {
      await persist({ data: { sessionId: s.sessionId, lines: transcript, interrupted: false } });
      const r = await summarize({ data: { sessionId: s.sessionId } });
      await new Promise((ok) => setTimeout(ok, Math.max(0, 5600 - (Date.now() - started))));
      setSummary(r.summary); setApproved(false); setStage('review');
    } catch (e) { setStage('choose'); setError(e instanceof Error ? e.message : 'Your Health Card could not be prepared. Please try again.'); }
  })(); }, [session, persist, summarize]);

  async function send() {
    if (!session) return; setBusy(true); setError('');
    try { await confirm({ data: { sessionId: session.sessionId, summary } }); setApproved(true); onSaved(); setStage('success'); }
    catch (e) { setError(e instanceof Error ? e.message : 'Submission failed.'); } finally { setBusy(false); }
  }

  const card = parseCard(summary);
  const phoneValid = /^[6-9]\d{9}$/.test(digits);

  const onAbandoned = useCallback(() => {
    const s = session;
    if (s && lines.current.length) void persist({ data: { sessionId: s.sessionId, lines: lines.current, interrupted: true } }).catch(() => {});
    setStage('choose'); setOpen('web'); setError('The conversation ended too early, so no Health Card was created. Start again when you are ready.');
  }, [session, persist]);

  // Caregiver rejects the draft: discard it and talk to Svara again from a fresh transcript.
  async function redo() {
    if (!session) return; setBusy(true); setError('');
    try { await persist({ data: { sessionId: session.sessionId, lines: [], interrupted: true } }); setSummary(''); setApproved(false); setStage('choose'); setOpen('web'); }
    catch (e) { setError(e instanceof Error ? e.message : 'Could not restart. Please try again.'); } finally { setBusy(false); }
  }

  if (stage === 'web' && session) return <SvaraVoice profileId={session.profileId} context={session.context} babyName={session.babyName} onTranscript={onTranscript} onEnded={onEnded} onCancel={onAbandoned} />;

  return <div className="svara-stage">
    {error && <HaloNotification title="Svara" message={error} duration={7000} onClose={() => setError('')} action={stage === 'choose' && last ? { label: last === 'web' ? 'Talk to Svara again' : 'Call me again', disabled: busy || (last === 'phone' && !(phoneValid && consent)), onClick: () => void (last === 'web' ? startWeb() : startPhone()) } : undefined} />}
    {stage === 'choose' && <div className="svara-stage-center">
      <div className="svara-hero-orb"><SvaraAnimation state="greeting" /></div>
      <h1 className="svara-title">Your check-in with Svara</h1>
      <p className="svara-lede">Choose how you would like to talk. Svara asks only the questions in your baby’s Care Plan.{due ? '' : ' Your next scheduled check-in is not due yet, but you can talk to Svara anytime.'}</p>

      <div className="svara-ctas">
        <div className={`svara-cta-group ${open === 'web' ? 'open' : ''}`}>
          <Button type="button" variant="ghost" className="svara-cta primary" disabled={busy} aria-expanded={open === 'web'} onClick={() => setOpen(open === 'web' ? null : 'web')}><Mic /><span><strong>Talk on this website</strong><small>Live voice with on-screen transcript</small></span><ChevronDown className="chev" /></Button>
          {open === 'web' && <div className="svara-tray">
            <p>Start a voice conversation with Svara now? Your microphone will be used.</p>
            <SecureNote>Your voice and answers are encrypted and only shared with your baby’s care team.</SecureNote>
            <Button className="w-full" disabled={busy} onClick={() => void startWeb()}>{busy ? <Loader2 className="animate-spin" /> : <Mic />}Start conversation</Button>
          </div>}
        </div>
        <div className={`svara-cta-group ${open === 'phone' ? 'open' : ''}`}>
          <Button type="button" variant="ghost" className="svara-cta" disabled={busy} aria-expanded={open === 'phone'} onClick={() => setOpen(open === 'phone' ? null : 'phone')}><Phone /><span><strong>Get a phone call</strong><small>Svara calls your mobile number</small></span><ChevronDown className="chev" /></Button>
          {open === 'phone' && <form className="svara-tray" onSubmit={(e) => { e.preventDefault(); if (phoneValid && consent) void startPhone(); }}>
            <DemoGuide title="Test Svara Through a Phone Call">Automated daily calls are disabled for this demo. Enter your phone number to receive a Svara call and experience the personalized voice check-in firsthand.</DemoGuide>
            <label className="svara-phone">
              <span className="svara-cc"><Phone aria-hidden="true" />+91</span>
              <input inputMode="numeric" autoComplete="tel-national" aria-label="10-digit mobile number" placeholder="98765-43210" value={formatMobile(digits)} onChange={(e) => setDigits(e.target.value.replace(/\D/g, '').slice(0, 10))} />
            </label>
            <label className="svara-consent"><input type="checkbox" checked={consent} onChange={(e) => setConsent(e.target.checked)} /><span>I agree to receive this check-in call from Svara on this number.</span></label>
            <SecureNote>Your number and call are kept private and encrypted, and used only for this check-in.</SecureNote>
            <Button type="submit" className="w-full" disabled={busy || !phoneValid || !consent}>{busy ? <Loader2 className="animate-spin" /> : <PhoneCall />}Call me now</Button>
          </form>}
        </div>
      </div>
    </div>}

    {stage === 'phone' && <div className="svara-stage-center">
      <div className="svara-hero-orb"><SvaraAnimation state={call === 'in_progress' ? 'listening' : 'idle'} /></div>
      {call === 'in_progress' ? <p className="svara-lede">{CALL_TEXT['in_progress']}</p> : <>
        <h1 className="svara-title">{call === 'completed' ? 'Preparing your Health Card' : 'Svara is calling you'}</h1>
        <p className="svara-lede">{call && ACTIVE.includes(call) ? <>Calling <strong>+91 {formatMobile(digits)}</strong>. </> : null}{CALL_TEXT[call ?? 'initiating'] ?? 'Connecting…'}</p>
      </>}
      {(call && ['no_answer', 'busy', 'failed', 'completed_no_transcript'].includes(call) || (call !== 'completed' && tick >= 0 && Date.now() - callSince > (call === 'in_progress' ? 15 * 60_000 : 45_000))) && <div className="flex flex-col items-center gap-2">{call && ACTIVE.includes(call) && <p className="svara-lede">Didn’t get the call, or it dropped? You can try again.</p>}<div className="flex gap-3"><Button onClick={() => void startPhone()} disabled={busy}>{busy ? <Loader2 className="animate-spin" /> : <PhoneCall />}Call me again</Button><Button variant="outline" onClick={() => { setStage('choose'); setOpen('web'); }}><Mic />Talk on website instead</Button></div></div>}
    </div>}

    {stage === 'generating' && <CardGeneration assistant="svara" title="Preparing your Health Card" phases={STEPS} />}

    {stage === 'review' && <div className="svara-stage-center wide">
      <h1 className="svara-title">Review your Health Card</h1>
      <p className="svara-lede">Check each topic. When it matches what you shared, approve it to send it straight to your care team.</p>
      {card ? <div className="svara-report-review"><LekhaDocument meta={{ kind: 'svara', babyName: session?.babyName ?? 'Baby', caregiverName: 'You', reason: 'Daily voice check-in', when: new Date().toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' }), clinician: 'Awaiting care team' }} card={card} approved={approved} onEdit={(i, v) => setSummary(JSON.stringify({ ...card, topics: card.topics.map((t, j) => j === i ? { ...t, finding: v } : t) }))} busy={busy} onApprove={() => void send()} approveLabel="Approve & Send to Care Team" onRedo={() => void redo()} redoLabel="Converse with Svara again" /></div>
        : <p className="svara-error">This earlier draft could not be opened. Start a fresh check-in with Svara below.</p>}
      {!card && <div className="svara-review-actions"><Button variant="outline" size="lg" disabled={busy} onClick={() => void redo()}><RotateCcw />Converse with Svara again</Button></div>}
    </div>}

    {stage === 'success' && <CompletionScreen character={<div className="svara-hero-orb"><SvaraAnimation state="completion" /></div>} eyebrow="Check-in recorded" title="Health Card Sent" rows={[{ label: 'Baby', value: session?.babyName ?? 'Baby' }, { label: 'Day of life', value: String(session?.context['day_of_life'] ?? '—') }, { label: 'Triage', value: card?.priority ?? 'Awaiting review' }, { label: 'Status', value: 'Sent to care team' }]} note="Your care team will review it shortly" onDone={() => void navigate({ to: '/caregiver/$section', params: { section: 'home' } })} />}
  </div>;
}
