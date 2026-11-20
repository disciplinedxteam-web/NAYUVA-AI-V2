import { useEffect, useRef, useState } from 'react';
import { useServerFn } from '@tanstack/react-start';
import { getNexconnToken } from '@/lib/care.functions';

type Sdk = typeof import('@nexconn/chat');
let session: Promise<{ sdk: Sdk; userId: string }> | null = null;
const listeners = new Set<(from: string, text: string) => void>();

/** One NextCon Chat SDK connection per page visit; messages fan out to every mounted listener. */
export function useNexconn(onSignal: (from: string, text: string) => void) {
  const issue = useServerFn(getNexconnToken);
  const [status, setStatus] = useState<'connecting' | 'live' | 'offline'>('connecting');
  const cb = useRef(onSignal); cb.current = onSignal;
  useEffect(() => {
    const fn = (f: string, t: string) => cb.current(f, t);
    listeners.add(fn);
    session ??= (async () => {
      const sdk = await import('@nexconn/chat');
      const { appKey, token, userId } = await issue();
      sdk.NCEngine.initialize({ appKey });
      sdk.NCEngine.addMessageHandler('nayuva', new sdk.MessageHandler({
        onMessageReceived({ messages }) {
          for (const m of messages) { const c = m.content as { text?: string } | undefined; listeners.forEach(l => l(String(m.senderUserId ?? ''), c?.text ?? '')); }
        },
      }));
      const r = await sdk.NCEngine.connect({ token });
      if (!r.isOk) throw new Error('connect failed');
      return { sdk, userId };
    })();
    let alive = true;
    session.then(() => alive && setStatus('live')).catch(() => { session = null; if (alive) setStatus('offline'); });
    return () => { alive = false; listeners.delete(fn); };
  }, []);
  async function signal(peer: string, text: string) {
    try { const s = await session; if (!s) return; await new s.sdk.DirectChannel(peer).sendMessage(new s.sdk.SendTextMessageParams({ text })); } catch { /* the saved message still arrives via refresh */ }
  }
  return { status, signal };
}
