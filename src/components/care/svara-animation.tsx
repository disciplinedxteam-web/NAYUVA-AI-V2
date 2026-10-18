import { useEffect, useRef, useState } from 'react';
import listening from '@/assets/svara/listening.webm.asset.json';
import speaking from '@/assets/svara/speaking-trim.webm.asset.json';
import greeting from '@/assets/svara/greeting.webm.asset.json';
import idle from '@/assets/svara/idle.webm.asset.json';
import done from '@/assets/svara/done.webm.asset.json';

type State = 'greeting' | 'idle' | 'listening' | 'speaking' | 'completion';

/**
 * Backgroundless Svara character clips.
 * - `greeting` (Namaskar) plays exactly once, then hands over to the looping `idle` clip.
 * - `completion` plays once and reports `onComplete` so navigation waits for the full clip.
 * - `listening` / `speaking` loop while the conversation runs.
 */
export function SvaraAnimation({ state, onComplete }: { state: State; onComplete?: () => void }) {
  const ref = useRef<HTMLVideoElement>(null);
  const [greeted, setGreeted] = useState(false);
  const effective = state === 'greeting' && greeted ? 'idle' : state;
  const clip = effective === 'speaking' ? speaking : effective === 'completion' ? done : effective === 'greeting' ? greeting : effective === 'idle' ? idle : listening;
  const loops = effective === 'listening' || effective === 'speaking' || effective === 'idle';

  useEffect(() => {
    const media = window.matchMedia('(prefers-reduced-motion: reduce)');
    const video = ref.current;
    const update = () => { if (media.matches) video?.pause(); else void video?.play().catch(() => {}); };
    update();
    media.addEventListener('change', update);
    return () => media.removeEventListener('change', update);
  }, [effective]);

  return <div className="svara-animation" role="img" aria-label={`Svara ${effective}`}>
    <video
      key={clip.url}
      ref={ref}
      src={clip.url}
      loop={loops}
      muted
      playsInline
      preload="auto"
      onEnded={() => { if (effective === 'greeting') setGreeted(true); if (effective === 'completion') onComplete?.(); }}
    />
  </div>;
}
