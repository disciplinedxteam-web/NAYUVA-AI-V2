import { useEffect, useState } from 'react';
import { AssistantCharacter } from './assistant-character';
import { CharacterVideo, type CharacterClip } from './character-video';

/**
 * Shared card-generation stage for Svara and Lekha: centered assistant character,
 * an animated phase label and a Nayuva rose progress bar. Purely presentational —
 * the real server request runs in the parent while this is shown.
 */
export function CardGeneration({ assistant, title, phases, clip }: { assistant: 'svara' | 'lekha'; title: string; phases: string[]; clip?: CharacterClip }) {
  const [step, setStep] = useState(0);
  useEffect(() => {
    setStep(0);
    const t = setInterval(() => setStep((s) => Math.min(s + 1, phases.length - 1)), 1500);
    return () => clearInterval(t);
  }, [phases.length]);
  const progress = Math.min(96, 8 + (step / Math.max(1, phases.length - 1)) * 88);
  return (
    <div className="card-generation" role="status" aria-live="polite">
      {clip || assistant === 'lekha' ? <CharacterVideo clip={clip ?? 'lekha-writing'} /> : <AssistantCharacter name={assistant} working />}
      <h1 className="svara-title">{title}</h1>
      <div className="flux-label-wrap">
        <p key={step} className="flux-label">{phases[step]}</p>
      </div>
      <div className="flux-bar" role="progressbar" aria-valuemin={0} aria-valuemax={100} aria-valuenow={Math.round(progress)} aria-valuetext={phases[step]}>
        <span className="flux-fill" style={{ width: `${progress}%` }}><i aria-hidden="true" /></span>
      </div>
    </div>
  );
}
