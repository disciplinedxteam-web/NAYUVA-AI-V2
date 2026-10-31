import taal from '@/assets/videos/taal.webm.asset.json';
import sutraWave from '@/assets/videos/sutra-wave.webm.asset.json';
import sutraSearch from '@/assets/videos/sutra-search.webm.asset.json';
import lekhaDone from '@/assets/videos/lekha-done.webm.asset.json';
import lekhaWriting from '@/assets/videos/lekha-writing.webm.asset.json';
import lekhaIdle from '@/assets/videos/lekha-idle.webm.asset.json';
import milanDone from '@/assets/videos/milan-done.webm.asset.json';
import milanWriting from '@/assets/videos/milan-writing.webm.asset.json';

const clips = {
  taal: [taal.url, 'Taal character reviewing the care calendar'],
  'sutra-wave': [sutraWave.url, 'Sutra waving hello'],
  'sutra-search': [sutraSearch.url, 'Sutra searching the care journey with a magnifying glass'],
  'lekha-done': [lekhaDone.url, 'Lekha giving a thumbs up'],
  'lekha-writing': [lekhaWriting.url, 'Lekha writing the document'],
  'lekha-idle': [lekhaIdle.url, 'Lekha ready to document'],
  'milan-done': [milanDone.url, 'Milan giving a thumbs up'],
  'milan-writing': [milanWriting.url, 'Milan writing in a notebook'],
} as const;
export type CharacterClip = keyof typeof clips;

/** Backgroundless, looping, non-interactive character clip. Size follows the shared --character-size reference. */
export function CharacterVideo({ clip, size, className = '' }: { clip: CharacterClip; size?: number | string; className?: string }) {
  const [src, label] = clips[clip];
  return <div className={`character-video ${className}`} role="img" aria-label={label} style={size ? { width: typeof size === 'number' ? `${size}px` : size } : undefined}>
    <video src={src} autoPlay loop muted playsInline preload="auto" disablePictureInPicture controls={false} tabIndex={-1} aria-hidden="true" />
  </div>;
}
