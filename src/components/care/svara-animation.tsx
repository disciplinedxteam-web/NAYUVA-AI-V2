import { useEffect,useRef } from 'react';
import listening from '@/assets/svara/listening.webm.asset.json';
import speaking from '@/assets/svara/speaking.webm.asset.json';
import completion from '@/assets/svara/completion.webm.asset.json';
import listenPoster from '@/assets/svara/listening-poster.png.asset.json';
import speakPoster from '@/assets/svara/speaking-poster.png.asset.json';
import completePoster from '@/assets/svara/completion-poster.png.asset.json';
export function SvaraAnimation({state}:{state:'listening'|'speaking'|'completion'|'idle'}){
 const ref=useRef<HTMLVideoElement>(null);const clip=state==='speaking'?speaking:state==='completion'?completion:listening;const poster=state==='speaking'?speakPoster:state==='completion'?completePoster:listenPoster;
 useEffect(()=>{const media=window.matchMedia('(prefers-reduced-motion: reduce)');const update=()=>{if(media.matches||state==='idle')ref.current?.pause();else void ref.current?.play().catch(()=>{});};update();media.addEventListener('change',update);return()=>media.removeEventListener('change',update);},[state]);
 return <div className="svara-animation" role="img" aria-label={`Svara ${state}`}><video key={clip.url} ref={ref} src={clip.url} poster={poster.url} loop muted playsInline preload="auto"/></div>;
}