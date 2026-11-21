import { useEffect, useRef, useState } from "react";
import { Volume2, VolumeX } from "lucide-react";
import track from "@/assets/gentle-beginnings.mp3.asset.json";

// Homepage-only background music; starts muted and loops while on.
export function MusicToggle() {
  const audio = useRef<HTMLAudioElement>(null);
  const [on, setOn] = useState(false);
  useEffect(() => () => audio.current?.pause(), []);
  const toggle = () => {
    const a = audio.current; if (!a) return;
    if (on) { a.pause(); setOn(false); } else { a.volume = 0.5; void a.play().then(() => setOn(true)).catch(() => setOn(false)); }
  };
  return (
    <>
      <audio ref={audio} src={track.url} loop preload="none" />
      <button type="button" className={`music-toggle ${on ? "is-on" : ""}`} aria-pressed={on} aria-label={on ? "Mute music" : "Play music"} title={on ? "Mute music" : "Play music"} onClick={toggle}>
        {on ? <Volume2 /> : <VolumeX />}
        {on && <span className="music-bars" aria-hidden="true"><i /><i /><i /></span>}
      </button>
    </>
  );
}
