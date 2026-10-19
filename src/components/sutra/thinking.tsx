import { useEffect, useState } from 'react';
import { Mascot } from '@/components/care/mascot';
export function SutraThinking({ first, ready = false }: { first: boolean; ready?: boolean }) {
 const [phase, setPhase] = useState('launch');
 useEffect(() => { if (!first) return; const a = setTimeout(() => setPhase('assemble'), 900); const b = setTimeout(() => setPhase('think'), 1650); return () => { clearTimeout(a); clearTimeout(b); }; }, [first]);
 useEffect(() => { if (!ready) return; setPhase('resolve'); const a = setTimeout(() => setPhase('condense'), 450); const b = setTimeout(() => setPhase('unfold'), 950); return () => { clearTimeout(a); clearTimeout(b); }; }, [ready]);
 const label = ready ? phase === 'condense' ? 'Bringing it together…' : phase === 'unfold' ? 'Your answer is ready' : 'Preparing your answer…' : first && phase === 'launch' ? 'Starting with your question…' : first && phase === 'assemble' ? 'Opening the care journey…' : 'Looking through the care records…';
 return <div className={`sutra-thinking ${first ? 'first' : 'normal'} phase-${phase}`} role="status" aria-live="polite"><div className="sutra-thinking-actor"><Mascot name="sutra" state="working" size={first ? 190 : 58} /></div><span key={label} className="sutra-phase-label">{label}</span>{first && <span className="sutra-progress-line" aria-hidden="true" />}</div>;
}
