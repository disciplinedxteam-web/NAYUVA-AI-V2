import { Component, useEffect, useRef, useState, type ReactNode } from 'react';
import { PhoneOff, Mic, MicOff, Pause, Play, RotateCcw } from 'lucide-react';
import { registeredSvaraVariables, isConversationComplete, hasCaregiverAnswer } from '@/lib/svara-agent-contract';
import { Button } from '@/components/ui/button';
import { SvaraAnimation } from './svara-animation';

export type Line = { role: 'user' | 'bot'; content: string; live?: boolean; pending?: boolean };
type Agent = { stop: () => Promise<void>; mute: () => void; unmute: () => void; isMuted: () => boolean };

/** Sarvam transcript payloads may be strings or nested objects; always reduce to plain text so React never renders an object. */
export function transcriptText(v: unknown, depth = 0): string {
  if (v == null || depth > 4) return '';
  if (typeof v === 'string') return v;
  if (typeof v === 'number' || typeof v === 'boolean') return String(v);
  if (Array.isArray(v)) return v.map((x) => transcriptText(x, depth + 1)).filter(Boolean).join(' ');
  if (typeof v === 'object') { const o = v as Record<string, unknown>; for (const k of ['text', 'transcript', 'content', 'en_text', 'message']) { const t = transcriptText(o[k], depth + 1); if (t) return t; } }
  return '';
}

/** Pure reducer for every Sarvam SDK message shape: text chunks stream into Svara's bubble, transcriptions finalise turns. */
export function applyMessage(lines: Line[], m: Record<string, unknown>): Line[] {
  const type = String(m['type'] ?? '').toLowerCase();
  const last = lines[lines.length - 1];
  // Svara's opening bubble opens as soon as she connects, pre-filled with the scripted opening line; real greeting text replaces it when it arrives.
  if (type === 'greeting_start') return lines.some((l) => l.role === 'bot') ? lines : [{ role: 'bot', content: transcriptText(m['text']).slice(0, 6000), live: true, pending: true }, ...lines];
  const isSlot = (l: Line) => l.role === 'bot' && (!!l.pending || (!!l.live && !l.content));
  if (type.includes('user_speech_start')) return last?.role === 'user' && last.live ? lines : [...lines.map((l) => (isSlot(l) ? l : { ...l, live: false })), { role: 'user', content: '', live: true }];
  if (type.includes('transcription')) {
    const content = transcriptText(m['content'] ?? m['text']).trim().slice(0, 6000); if (!content) return lines;
    const role: Line['role'] = String(m['role'] ?? '').toLowerCase() === 'user' ? 'user' : 'bot';
    const slot = role === 'bot' ? lines.findIndex(isSlot) : -1;
    if (slot >= 0) return lines.map((l, k) => (k === slot ? { role, content } : l));
    const i = findLast(lines, (l) => l.role === role && !!l.live);
    if (i >= 0) return lines.map((l, k) => (k === i ? { role, content } : l));
    if (last && last.role === role && last.content === content) return lines;
    return [...lines, { role, content }];
  }
  if (type.includes('text')) {
    const t = transcriptText(m['text'] ?? m['content']); if (!t) return lines;
    const chunk = type.includes('chunk');
    const done = String(m['status'] ?? '').toLowerCase() === 'completed';
    // Svara's greeting text can arrive after the caregiver starts talking: fill the reserved opening bubble first.
    const greet = lines.findIndex(isSlot);
    if (greet >= 0) { const g = lines[greet]!; const base = g.pending ? '' : g.content; return lines.map((l, k) => (k === greet ? { role: 'bot' as const, content: (chunk ? base + t : t).slice(0, 6000), live: chunk && !done } : l)); }
    if (last?.role === 'bot' && last.live) return [...lines.slice(0, -1), { role: 'bot', content: (chunk ? last.content + t : t).slice(0, 6000), live: !done && chunk }];
    return [...lines.map((l) => (l.role === 'user' && l.live && !l.content ? null : l)).filter(Boolean) as Line[], { role: 'bot', content: t.slice(0, 6000), live: chunk && !done }];
  }
  return lines;
}
function findLast<T>(a: T[], f: (x: T) => boolean) { for (let i = a.length - 1; i >= 0; i--) { const item = a[i]; if (item !== undefined && f(item)) return i; } return -1; }

/** Full-screen live Svara conversation via the Sarvam Web SDK. The key stays on the server proxy (/api/sarvam/). */
function SvaraLiveInner({ profileId, context, babyName, onTranscript, onEnded, onCancel }: { profileId: string; context: Record<string, string>; babyName: string; onTranscript: (lines: Line[]) => void; onEnded: () => void; onCancel: () => void }) {
  const [state, setState] = useState('CONNECTING');
  const [lines, setLines] = useState<Line[]>([]);
  const [error, setError] = useState('');
  const [muted, setMuted] = useState(false);
  const [held, setHeld] = useState(false);
  const agent = useRef<Agent | null>(null);
  const ended = useRef(false);
  const latestLines = useRef<Line[]>([]);
  const ready = useRef(false);
  const [attempt, setAttempt] = useState(0);
  const logRef = useRef<HTMLDivElement>(null);
  useEffect(() => { logRef.current?.scrollTo({ top: logRef.current.scrollHeight, behavior: 'smooth' }); }, [lines]);
  useEffect(() => { latestLines.current = lines; if (lines.length) onTranscript(lines.filter((l) => l.content).map(({ role, content }) => ({ role, content }))); }, [lines, onTranscript]);

  // Only a genuinely completed conversation becomes a card; anything else restarts fresh.
  function finish() { if (ended.current) return; ended.current = true; const settled = latestLines.current.map((l) => ({ ...l, live: false, pending: false })); latestLines.current = settled; setLines(settled); onTranscript(settled.filter(l => l.content)); void agent.current?.stop(); agent.current = null; setMuted(false); setHeld(false); if (isConversationComplete(latestLines.current)) onEnded(); else onCancel(); }
  function toggleMute() { const a = agent.current; if (!a) return; if (a.isMuted()) { a.unmute(); setMuted(false); setHeld(false); } else { a.mute(); setMuted(true); } }
  function toggleHold() { const a = agent.current; if (!a) return; if (held) { a.unmute(); setHeld(false); setMuted(false); } else { a.mute(); setHeld(true); setMuted(true); } }
  useEffect(() => {
    let cancelled = false;
    ended.current = false; ready.current = false; setError(''); setState('CONNECTING');
    const ingest = async (m: unknown) => { if (!cancelled && m && typeof m === 'object') setLines((l) => { const next = applyMessage(l, m as Record<string, unknown>); latestLines.current = next; return next; }); };
    (async () => {
      try {
        const { ConversationAgent, BrowserAudioInterface, InteractionType } = await import('sarvam-conv-ai-sdk/browser');
        if (cancelled) return;
        const a = new ConversationAgent({
          apiKey: '',
          baseUrl: `${window.location.origin}/api/sarvam/${context['check_in_id']}/`,
          config: {
            user_identifier_type: 'custom', user_identifier: profileId,
            org_id: '01a06c4c-1ad9-769a-9b30-14878bafef8a', workspace_id: '01a06c4c-1ae1-7d6f-a195-f7c92c3f2058', app_id: 'Conversatio-1e149739-300e',
            interaction_type: InteractionType.CALL, input_sample_rate: 16000, output_sample_rate: 16000,
            agent_variables: registeredSvaraVariables(context),
          },
          audioInterface: new BrowserAudioInterface(),
          textCallback: ingest, transcriptCallback: ingest, eventCallback: ingest,
          // The SDK reports states in lowercase; normalise so readiness and the opening bubble are detected.
          stateCallback: async (s: unknown) => { if (cancelled) return; const value = (typeof s === 'string' ? s : transcriptText(s) || 'CONNECTED').toUpperCase(); if (['CONNECTED','LISTENING','SPEAKING'].includes(value)) ready.current = true; if (['CONNECTED','LISTENING','SPEAKING'].includes(value)) void ingest({ type: 'greeting_start', text: context['opening_line'] ?? '' }); setState(value); },
          // Let Svara's closing words land in the transcript before the session closes.
          endCallback: async () => { if (cancelled || ended.current) return; await new Promise((r) => setTimeout(r, 700)); if (cancelled || ended.current) return; if (ready.current || hasCaregiverAnswer(latestLines.current)) finish(); else { setError('The conversation ended before it was complete. Start again when you are ready.'); setState('IDLE'); } },
        } as never) as unknown as Agent & { start: () => Promise<void>; waitForConnect: (t?: number) => Promise<boolean> };
        agent.current = a;
        await a.start();
        if (!(await a.waitForConnect(10))) throw new Error('timeout');
      } catch (e) {
        if (!cancelled) { setError('Svara could not connect. Please allow microphone access and try again.'); setState('IDLE'); await agent.current?.stop(); agent.current = null; }
      }
    })();
    return () => { cancelled = true; ready.current = false; void agent.current?.stop(); agent.current = null; };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [attempt]);

  const s = state.toLowerCase();
  const label = error ? 'Not connected' : s.includes('connect') && !s.includes('ed') ? 'Connecting…' : s.includes('speak') ? 'Svara is speaking' : s.includes('listen') ? 'Listening' : s.includes('think') || s.includes('process') ? 'Thinking…' : 'In conversation';
  return <div className="svara-live" role="dialog" aria-label="Svara conversation">
    <header className="svara-live-top"><span className="svara-live-badge"><i aria-hidden="true" />Live · {babyName}</span><span className="svara-live-state">{label}</span></header>
    <div ref={logRef} className="svara-live-log" aria-live="polite" data-no-translate>
      <div className="svara-live-inner">
        {!lines.length && !error && <p className="svara-live-hint">Svara will greet you in a moment. Speak naturally — your words appear here as you talk.</p>}
        {lines.map((l, i) => l.role === 'user'
          ? <div key={i} className="live-turn user"><p className={l.live && !l.content ? 'is-typing' : ''}>{l.content || <><span /><span /><span /></>}</p></div>
          : <div key={i} className="live-turn bot"><div className="live-bot-card"><span className="live-bot-name">Svara</span>{l.content ? <p>{l.content}{l.live && <span className="live-caret" aria-hidden="true" />}</p> : <p className="is-typing" aria-label="Svara is greeting you"><span /><span /><span /></p>}</div></div>)}
        {error && <p className="svara-live-error" role="alert">{error}</p>}
      </div>
    </div>
    <footer className="svara-live-dock">
      <div className="svara-live-orb"><SvaraAnimation state={held?'idle':s.includes('speak')?'speaking':s.includes('listen')?'listening':'idle'}/></div>
      {held && <p className="svara-live-hold" role="status">On hold — Svara is waiting for you.</p>}
      <div className="svara-live-controls">
        {error && <Button type="button" onClick={() => { void agent.current?.stop(); setAttempt(a => a + 1); }}><RotateCcw />Reconnect</Button>}
        {!error && <Button type="button" variant="outline" className="svara-ctl" aria-pressed={muted} onClick={toggleMute}>{muted ? <MicOff /> : <Mic />}{muted ? 'Unmute' : 'Mute'}</Button>}
        {!error && <Button type="button" variant="outline" className="svara-ctl" aria-pressed={held} onClick={toggleHold}>{held ? <Play /> : <Pause />}{held ? 'Resume' : 'Hold'}</Button>}
        <Button type="button" size="lg" variant="destructive" className="svara-end" onClick={finish}><PhoneOff />{error ? 'Close' : 'End conversation'}</Button>
      </div>
    </footer>
  </div>;
}

class VoiceBoundary extends Component<{ children: ReactNode; onReset: () => void }, { failed: boolean }> {
  override state = { failed: false };
  static getDerivedStateFromError() { return { failed: true }; }
  override componentDidCatch(e: unknown) { console.error('Svara voice error', e); }
  override render() {
    if (!this.state.failed) return this.props.children;
    return <div className="svara-live" role="status"><div className="svara-stage-center"><p>The voice conversation was interrupted. Your saved transcript is kept.</p>
      <Button type="button" onClick={() => { this.setState({ failed: false }); this.props.onReset(); }}><Mic />Reconnect</Button></div></div>;
  }
}

/** Isolated so a voice/stream error can never take down the dashboard. */
export function SvaraVoice(props: Parameters<typeof SvaraLiveInner>[0]) {
  const [key, setKey] = useState(0);
  return <VoiceBoundary onReset={() => setKey((k) => k + 1)}><SvaraLiveInner key={key} {...props} /></VoiceBoundary>;
}
