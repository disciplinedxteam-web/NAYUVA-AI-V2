import { useCallback, useEffect, useRef, useState } from 'react';
import { useServerFn } from '@tanstack/react-start';
import { useNavigate } from '@tanstack/react-router';
import { Mic, Phone, ArrowRight, Check, Clock, ChevronDown, Loader2, PhoneCall } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { ProductOrb } from '@/components/product-orb';
import { SvaraVoice, type Line } from './svara-voice';
import { CareTicket } from './care-ticket';
import { CardGeneration } from './card-generation';
import { SvaraAnimation } from './svara-animation';
import { parseCard } from '@/lib/care-card';
import { prepareSvaraSession, saveSvaraTranscript, saveSvaraPhone, summarizeSvaraSession, confirmSvaraSession, getSvaraCallStatus } from '@/lib/care.functions';

type Session = Awaited<ReturnType<typeof prepareSvaraSession>>;
type Stage = 'choose' | 'web' | 'phone' | 'generating' | 'review' | 'success';
const STEPS = ['Reading your conversation with Svara', 'Matching each answer to your Care Plan topics', 'Writing short, clear findings per topic', 'Suggesting a review category for your care team', 'Laying out your Health Card'];
const ACTIVE = ['initiating', 'call_placed', 'in_progress'];
const CALL_TEXT: Record<string, string> = { initiating: 'Placing your call…', call_placed: 'Your phone is ringing. Please answer to begin.', in_progress: 'You are speaking with Svara.', completed: 'Call ended. Preparing your Health Card…', completed_no_transcript: 'The call ended before any answers were recorded.', no_answer: 'The call was not answered.', busy: 'Your line was busy.', failed: 'The call could not be completed.' };
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

  // Resume a check-in that already has a draft card awaiting the caregiver.
  useEffect(() => { if (!due) return; void prepare({ data: { channel: 'website_voice' } }).then((s) => { const sm = (s.summary ?? {}) as Record<string, unknown>; if (s.context['check_in_status'] === 'awaiting_confirmation' && typeof sm['summary'] === 'string') { setSession(s); setSummary(sm['summary']); setStage('review'); } else if (s.phone) setDigits(s.phone.replace(/\D/g, '').slice(-10)); }).catch(() => {}); // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [due]);

  // Phone: poll the real call record until a draft card exists.
  useEffect(() => {
    if (stage !== 'phone' || !session) return;
    const t = setInterval(() => { void callStatusFn({ data: { sessionId: session.sessionId } }).then((r) => {
      if (r.status === 'awaiting_confirmation' && r.draft) { const draft = r.draft; setCall('completed'); setSummary(draft); setStage('review'); return; }
      setCall(r.callStatus);
    }).catch(() => {}); }, 4000);
    return () => clearInterval(t);
  }, [stage, session, callStatusFn]);

  const onTranscript = useCallback((v: Line[]) => { lines.current = v; }, []);
  useEffect(() => { if (stage !== 'web' || !session) return; const t = setInterval(() => { if (lines.current.length) void persist({ data: { sessionId: session.sessionId, lines: lines.current } }).catch(() => {}); }, 5000); return () => clearInterval(t); }, [stage, session, persist]);

  async function startWeb() {
    setBusy(true); setError('');
    try { const s = await prepare({ data: { channel: 'website_voice' } }); setSession(s); lines.current = []; setStage('web'); }
    catch (e) { setError(e instanceof Error ? e.message : 'Check-in unavailable.'); } finally { setBusy(false); }
  }
  async function startPhone() {
    setBusy(true); setError('');
    try { const s = await prepare({ data: { channel: 'phone' } }); setSession(s); const r = await phoneSave({ data: { sessionId: s.sessionId, phone: `+91${digits}`, consent: true } }); setCall(r.status); setStage('phone'); }
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
    try { await confirm({ data: { sessionId: session.sessionId, summary } }); onSaved(); setStage('success'); window.setTimeout(() => void navigate({ to: '/caregiver/$section', params: { section: 'home' } }), 1800); }
    catch (e) { setError(e instanceof Error ? e.message : 'Submission failed.'); } finally { setBusy(false); }
  }

  const card = parseCard(summary);
  const phoneValid = /^[6-9]\d{9}$/.test(digits);

  const onAbandoned = useCallback(() => {
    const s = session;
    if (s && lines.current.length) void persist({ data: { sessionId: s.sessionId, lines: lines.current, interrupted: true } }).catch(() => {});
    setStage('choose'); setError('The conversation ended before it was complete, so no Health Card was created. Start again when you are ready.');
  }, [session, persist]);

  if (stage === 'web' && session) return <SvaraVoice profileId={session.profileId} context={session.context} babyName={session.babyName} onTranscript={onTranscript} onEnded={onEnded} onCancel={onAbandoned} />;

  return <div className="svara-stage">
    {stage === 'choose' && <div className="svara-stage-center">
      <div className="svara-hero-orb"><SvaraAnimation state="greeting" /></div>
      <h1 className="svara-title">Your check-in with Svara</h1>
      <p className="svara-lede">Choose how you would like to talk. Svara asks only the questions in your baby’s Care Plan.{due ? '' : ' Your next scheduled check-in is not due yet, but you can talk to Svara anytime.'}</p>
      {error && <p role="alert" className="svara-error">{error}</p>}
      <div className="svara-ctas">
        <div className={`svara-cta-group ${open === 'web' ? 'open' : ''}`}>
          <Button type="button" variant="ghost" className="svara-cta primary" disabled={busy} aria-expanded={open === 'web'} onClick={() => setOpen(open === 'web' ? null : 'web')}><Mic /><span><strong>Talk on this website</strong><small>Live voice with on-screen transcript</small></span><ChevronDown className="chev" /></Button>
          {open === 'web' && <div className="svara-tray">
            <p>Start a voice conversation with Svara now? Your microphone will be used.</p>
            <Button className="w-full" disabled={busy} onClick={() => void startWeb()}>{busy ? <Loader2 className="animate-spin" /> : <Mic />}Start conversation</Button>
          </div>}
        </div>
        <div className={`svara-cta-group ${open === 'phone' ? 'open' : ''}`}>
          <Button type="button" variant="ghost" className="svara-cta" disabled={busy} aria-expanded={open === 'phone'} onClick={() => setOpen(open === 'phone' ? null : 'phone')}><Phone /><span><strong>Get a phone call</strong><small>Svara calls your mobile number</small></span><ChevronDown className="chev" /></Button>
          {open === 'phone' && <form className="svara-tray" onSubmit={(e) => { e.preventDefault(); if (phoneValid && consent) void startPhone(); }}>
            <label className="svara-phone">
              <span className="svara-cc"><Phone aria-hidden="true" />+91</span>
              <input inputMode="numeric" autoComplete="tel-national" aria-label="10-digit mobile number" placeholder="98765-43210" value={formatMobile(digits)} onChange={(e) => setDigits(e.target.value.replace(/\D/g, '').slice(0, 10))} />
            </label>
            <label className="svara-consent"><input type="checkbox" checked={consent} onChange={(e) => setConsent(e.target.checked)} /><span>I agree to receive this check-in call from Svara on this number.</span></label>
            <Button type="submit" className="w-full" disabled={busy || !phoneValid || !consent}>{busy ? <Loader2 className="animate-spin" /> : <PhoneCall />}Call me now</Button>
          </form>}
        </div>
      </div>
    </div>}

    {stage === 'phone' && <div className="svara-stage-center">
      <div className="svara-hero-orb"><SvaraAnimation state="idle" /></div>
      <h1 className="svara-title">Svara is on the phone with you</h1>
      <p className="svara-lede">Calling <strong>+91 {formatMobile(digits)}</strong>. {CALL_TEXT[call ?? 'initiating'] ?? 'Connecting…'}</p>
      {call && ['no_answer', 'busy', 'failed', 'completed_no_transcript'].includes(call) && <div className="flex gap-3"><Button onClick={() => void startPhone()} disabled={busy}><PhoneCall />Call me again</Button><Button variant="ghost" onClick={() => setStage('choose')}>Back</Button></div>}
      {call && ACTIVE.includes(call) && <p className="svara-lede small">Keep this page open. Your Health Card appears here when the call ends.</p>}
    </div>}

    {stage === 'generating' && <CardGeneration assistant="svara" title="Preparing your Health Card" phases={STEPS} />}

    {stage === 'review' && <div className="svara-stage-center wide">
      <h1 className="svara-title">Review your Health Card</h1>
      <p className="svara-lede">Check each topic. Approve when it matches what you shared, then send it to your care team.</p>
      {error && <p role="alert" className="svara-error">{error}</p>}
      {card ? <CareTicket source="Svara" title={session?.babyName ?? 'Health Card'} subtitle="Check-in summary" date={new Date().toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })} card={card} stamp={approved ? 'Approved' : null} stubLabel="Caregiver" action={{ label: 'Approve card', onClick: () => setApproved(true) }} />
        : <p className="svara-error">This card could not be displayed. Please start the check-in again.</p>}
      <div className="svara-review-actions">
        {approved && <Button variant="ghost" onClick={() => setApproved(false)}>Undo approval</Button>}
        <Button size="lg" disabled={!approved || busy || !card} onClick={() => void send()}>{busy ? <Loader2 className="animate-spin" /> : null}Send to Care Team<ArrowRight /></Button>
      </div>
    </div>}

    {stage === 'success' && <div className="svara-stage-center">
      <div className="svara-hero-orb"><SvaraAnimation state="completion" onComplete={() => void navigate({ to: '/caregiver/$section', params: { section: 'home' } })} /></div>
      <h1 className="svara-title">Card submitted to your care team</h1>
      <p className="svara-lede">Taking you back to Home…</p>
    </div>}
  </div>;
}
