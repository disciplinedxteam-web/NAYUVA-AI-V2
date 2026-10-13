import { Component, useEffect, useRef, useState, type ReactNode } from 'react';
import { Mic, Square } from 'lucide-react';
import { Button } from '@/components/ui/button';

type Line = { role: 'user' | 'bot'; content: string };
type Agent = { stop: () => Promise<void> };

/** Sarvam transcript payloads may be strings or nested objects; always reduce to plain text so React never renders an object. */
export function transcriptText(v: unknown, depth = 0): string {
  if (v == null || depth > 4) return '';
  if (typeof v === 'string') return v;
  if (typeof v === 'number' || typeof v === 'boolean') return String(v);
  if (Array.isArray(v)) return v.map((x) => transcriptText(x, depth + 1)).filter(Boolean).join(' ');
  if (typeof v === 'object') { const o = v as Record<string, unknown>; for (const k of ['text', 'transcript', 'content', 'en_text', 'message']) { const t = transcriptText(o[k], depth + 1); if (t) return t; } }
  return '';
}

/** Live Svara voice session via the Sarvam Web SDK. The key stays on the server proxy (/api/sarvam/). */
function SvaraVoiceInner({ profileId, context, onTranscript, onEnded }: { profileId: string; context: Record<string, string>; onTranscript: (lines: Line[]) => void; onEnded: () => void }) {
  const [state, setState] = useState('IDLE');
  const [lines, setLines] = useState<Line[]>([]);
  const [error, setError] = useState('');
  const agent = useRef<Agent | null>(null);
  const botLive = useRef(false);
  const logRef = useRef<HTMLDivElement>(null);
  useEffect(() => { logRef.current?.scrollTo({ top: logRef.current.scrollHeight }); }, [lines]);
  useEffect(() => () => { void agent.current?.stop(); }, []);
  useEffect(() => { if(lines.length)onTranscript(lines); }, [lines, onTranscript]);

  async function start() {
    setError(''); setLines([]); botLive.current = false; setState('CONNECTING');
    try {
      const { ConversationAgent, BrowserAudioInterface, InteractionType, Role } = await import('sarvam-conv-ai-sdk/browser');
      const a = new ConversationAgent({
        apiKey: '',
        baseUrl: `${window.location.origin}/api/sarvam/${context['check_in_id']}/`,
        config: {
          user_identifier_type: 'custom', user_identifier: profileId,
          org_id: '01a06c4c-1ad9-769a-9b30-14878bafef8a', workspace_id: '01a06c4c-1ae1-7d6f-a195-f7c92c3f2058', app_id: 'Conversatio-1e149739-300e',
          interaction_type: InteractionType.CALL, input_sample_rate: 16000, output_sample_rate: 16000,
          agent_variables: context,
        },
        audioInterface: new BrowserAudioInterface(),
        textCallback: async (m: { type?: unknown; text?: unknown; content?: unknown }) => { try { const t = transcriptText(m?.text ?? m?.content ?? m); if (!t) return; const chunk = String(m?.type ?? '').toLowerCase().includes('chunk'); setLines((l) => { const last = l[l.length - 1]; if (botLive.current && last?.role === 'bot') { const content = (chunk ? last.content + t : t).slice(0, 6000); return [...l.slice(0, -1), { role: 'bot', content }]; } botLive.current = true; return [...l, { role: 'bot', content: t.slice(0, 6000) }]; }); } catch { /* ignore malformed text event */ } },
        transcriptCallback: async (m: { role?: unknown; content?: unknown }) => { try { const content = transcriptText(m?.content ?? m).trim().slice(0, 6000); if (!content) return; const role: Line['role'] = m?.role === Role.USER || m?.role === 'user' ? 'user' : 'bot'; setLines((l) => { const last = l[l.length - 1]; if (role === 'bot' && botLive.current && last?.role === 'bot') { botLive.current = false; return [...l.slice(0, -1), { role, content }]; } botLive.current = false; if (last && last.role === role && last.content === content) return l; return [...l, { role, content }]; }); } catch { /* ignore malformed transcript event */ } },
        stateCallback: async (s: unknown) => { setState(typeof s === 'string' ? s : transcriptText(s) || 'CONNECTED'); },
        endCallback: async () => { setState('IDLE'); agent.current = null; onEnded(); },
      } as never) as unknown as Agent & { start: () => Promise<void>; waitForConnect: (t?: number) => Promise<boolean> };
      agent.current = a;
      await a.start();
      if (!(await a.waitForConnect(10))) throw new Error('timeout');
    } catch (e) {
      setError('Svara could not connect. Check microphone access or type your update below.');
      setState('IDLE'); await agent.current?.stop(); agent.current = null;
    }
  }
  const live = state !== 'IDLE' && state !== 'ERROR';
  return <div className="transcription">
    <div className="flex items-center justify-between gap-4"><span className="eyebrow">{live ? `Svara · ${state.toLowerCase()}` : 'Talk to Svara'}</span>
      <Button type="button" variant={live ? 'outline' : 'default'} onClick={() => { if (live) { void agent.current?.stop(); setState('IDLE'); onEnded(); } else void start(); }}>{live ? <Square /> : <Mic />}{live ? 'End conversation' : 'Start voice check-in'}</Button></div>
    {(live || lines.length > 0) && <div ref={logRef} data-no-translate className="live-chat" aria-live="polite">{lines.length ? lines.map((l, i) => <div key={i} className={`chat-bubble ${l.role === 'user' ? 'me' : 'bot'}`}>{l.content}</div>) : <p className="nv-sub">Listening… the conversation will appear here as you speak.</p>}</div>}
    {error && <p className="text-sm text-muted-foreground mt-3" role="status">{error}</p>}
  </div>;
}

class VoiceBoundary extends Component<{ children: ReactNode; onReset: () => void }, { failed: boolean }> {
  override state = { failed: false };
  static getDerivedStateFromError() { return { failed: true }; }
  override componentDidCatch(e: unknown) { console.error('Svara voice error', e); }
  override render() {
    if (!this.state.failed) return this.props.children;
    return <div className="transcription" role="status"><p className="text-sm">The voice conversation was interrupted. Your saved transcript is kept — you can restart or continue by typing below.</p>
      <Button type="button" className="mt-3" onClick={() => { this.setState({ failed: false }); this.props.onReset(); }}><Mic />Restart voice check-in</Button></div>;
  }
}

/** Isolated so a voice/stream error can never take down the dashboard. */
export function SvaraVoice(props: Parameters<typeof SvaraVoiceInner>[0]) {
  const [key, setKey] = useState(0);
  return <VoiceBoundary onReset={() => setKey((k) => k + 1)}><SvaraVoiceInner key={key} {...props} /></VoiceBoundary>;
}
