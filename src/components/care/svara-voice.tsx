import { useEffect, useRef, useState } from 'react';
import { Mic, Square } from 'lucide-react';
import { Button } from '@/components/ui/button';

type Line = { role: 'user' | 'bot'; content: string };
type Agent = { stop: () => Promise<void> };

/** Live Svara voice session via the Sarvam Web SDK. The key stays on the server proxy (/api/sarvam/). */
export function SvaraVoice({ profileId, context, onTranscript, onEnded }: { profileId: string; context: Record<string, string>; onTranscript: (lines: Line[]) => void; onEnded: () => void }) {
  const [state, setState] = useState('IDLE');
  const [lines, setLines] = useState<Line[]>([]);
  const [error, setError] = useState('');
  const agent = useRef<Agent | null>(null);
  useEffect(() => () => { void agent.current?.stop(); }, []);
  useEffect(() => { if(lines.length)onTranscript(lines); }, [lines, onTranscript]);

  async function start() {
    setError(''); setLines([]); setState('CONNECTING');
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
        transcriptCallback: async (m: { role: unknown; content: string }) => { setLines((l) => [...l, { role: m.role === Role.USER ? 'user' : 'bot', content: m.content }]); },
        stateCallback: async (s: unknown) => { setState(String(s)); },
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
    {lines.length > 0 && <div data-no-translate className="mt-3 space-y-2 text-sm">{lines.map((l, i) => <p key={i}><strong>{l.role === 'bot' ? 'Svara' : 'You'}:</strong> {l.content}</p>)}</div>}
    {error && <p className="text-sm text-muted-foreground mt-3" role="status">{error}</p>}
  </div>;
}
