import { useEffect, useRef, useState } from 'react';
import intro from '@/assets/namaskar-intro.mp4.asset.json';

/** Full-screen greeting animation with an optional real-progress bar and message underneath. */
export function LoadingScreen({ progress, message, loop = true, leaving = false, onEnded, fitSeconds, intro: isIntro = false }: { progress?: number | undefined; message?: string | undefined; loop?: boolean; leaving?: boolean; onEnded?: () => void; fitSeconds?: number; intro?: boolean }) {
  return <div className={`nv-loading ${isIntro ? 'is-intro' : ''} ${leaving ? 'is-leaving' : ''}`} role="status" aria-live="polite" aria-label={message ?? 'Welcome to Nayuva'}>
    <video className="nv-loading-video" src={intro.url} autoPlay muted playsInline loop={loop} onEnded={onEnded} onLoadedMetadata={e => { const v = e.currentTarget; if (fitSeconds && v.duration > fitSeconds) v.playbackRate = Math.min(3, v.duration / fitSeconds); }} aria-hidden="true" />
    {progress !== undefined && <div className="nv-loading-progress">
      <p key={message}>{message}</p>
      <div className="nv-loading-bar" aria-hidden="true"><span style={{ width: `${Math.max(6, Math.min(100, progress))}%` }} /></div>
      <small>{Math.round(progress)}%</small>
    </div>}
  </div>;
}

const pageProgress = () => typeof document === 'undefined' ? 20 : document.readyState === 'complete' ? 100 : document.readyState === 'interactive' ? 70 : 35;

/** Plays the greeting once on every fresh website visit; shows a progress bar only if the page is still loading afterwards. */
export function SiteIntro() {
  const [played, setPlayed] = useState(false), [progress, setProgress] = useState(20), [leaving, setLeaving] = useState(false), [gone, setGone] = useState(false);
  const fallback = useRef<number>(0);
  useEffect(() => {
    const update = () => setProgress(pageProgress());
    update(); document.addEventListener('readystatechange', update); window.addEventListener('load', update);
    const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    fallback.current = window.setTimeout(() => setPlayed(true), reduce ? 500 : 1000);
    return () => { document.removeEventListener('readystatechange', update); window.removeEventListener('load', update); clearTimeout(fallback.current); };
  }, []);
  const done = played && progress >= 70;
  useEffect(() => { if (!done) return; setLeaving(true); const t = setTimeout(() => setGone(true), 300); return () => clearTimeout(t); }, [done]);
  if (gone) return null;
  return <LoadingScreen intro fitSeconds={1.0} loop={false} leaving={leaving} onEnded={() => setPlayed(true)} {...(played && progress < 70 ? { progress, message: 'Almost there, getting everything ready for you…' } : {})} />;
}
