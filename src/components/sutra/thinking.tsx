import { useEffect, useState } from 'react';
import { Mascot } from '@/components/care/mascot';
export function SutraThinking({ first, ready = false }: { first: boolean; ready?: boolean }) {
 const [phase, setPhase] = useState('launch');
 useEffect(() => { if (!first) return; const a = setTimeout(() => setPhase('assemble'), 900); const b = setTimeout(() => setPhase('think'), 1650); return () => { clearTimeout(a); clearTimeout(b); }; }, [first]);
 useEffect(() => { if (!ready) return; setPhase('resolve'); const a = setTimeout(() => setPhase('condense'), 450); const b = setTimeout(() => setPhase('unfold'), 950); return () => { clearTimeout(a); clearTimeout(b); }; }, [ready]);
 return <div className={`sutra-thinking ${first ? 'first' : 'normal'} phase-${phase}`} role="status" aria-live="polite"><div className="sutra-thinking-actor"><Mascot name="sutra" state="working" size={first ? 190 : 58} /></div><span>{ready ? 'Your answer is ready' : 'Looking through the care records…'}</span>{first && <span className="sutra-progress-line" aria-hidden="true" />}</div>;
}
