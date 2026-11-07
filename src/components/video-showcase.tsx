import { useState } from "react";
import { Play } from "lucide-react";
import { GlassToggle } from "@/components/ui/glass-toggle";

const VIDEOS = [
  { key: "how", label: "How Nayuva Works", id: "YaOMywsSfH4", title: "How Nayuva Works", body: "A walkthrough of the care journey, from Care Plan to daily check-ins, reviews and follow-up." },
  { key: "film", label: "Nayuva Film", id: "JEhJAyNnMWo", title: "Nayuva Film", body: "The story behind Nayuva and the families it is built to accompany after discharge." },
];

/** Homepage video section: YouTube thumbnail cards that play inline on click. */
export function VideoShowcase() {
  const [tab, setTab] = useState("how");
  const [playing, setPlaying] = useState<string | null>(null);
  const v = VIDEOS.find((x) => x.key === tab)!;
  return (
    <section id="videos" className="section-band relative py-14 md:py-20">
      <div className="mx-auto max-w-5xl px-6">
        <div className="mx-auto mb-8 max-w-2xl text-center">
          <p className="eyebrow mb-3">See it in action</p>
          <h2 className="text-4xl font-bold leading-tight tracking-tight md:text-5xl">Watch care continue, beyond discharge.</h2>
          <p className="mt-4 text-lg leading-relaxed text-muted-foreground">See how Nayuva keeps families guided and care teams informed, then watch the story that inspired it.</p>
        </div>
        <div className="mb-6 flex justify-center">
          <GlassToggle label="Choose video" value={tab} onChange={(k) => { setTab(k); setPlaying(null); }} options={VIDEOS.map((x) => ({ key: x.key, label: x.label }))} />
        </div>
        <div className="relative mx-auto aspect-video w-full overflow-hidden rounded-3xl border border-primary/15 bg-foreground shadow-soft">
          {playing === v.id ? (
            <iframe className="absolute inset-0 size-full" src={`https://www.youtube-nocookie.com/embed/${v.id}?autoplay=1&rel=0`} title={v.title} allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" allowFullScreen />
          ) : (
            <button type="button" onClick={() => setPlaying(v.id)} className="group absolute inset-0 size-full text-left" aria-label={`Play ${v.title}`}>
              <img src={`https://i.ytimg.com/vi/${v.id}/maxresdefault.jpg`} onError={(e) => { e.currentTarget.src = `https://i.ytimg.com/vi/${v.id}/hqdefault.jpg`; }} alt="" className="absolute inset-0 size-full object-cover transition duration-500 group-hover:scale-[1.02]" />
              <span className="absolute inset-0 bg-gradient-to-t from-foreground/70 via-foreground/10 to-transparent" />
              <span className="absolute left-1/2 top-1/2 flex size-16 -translate-x-1/2 -translate-y-1/2 items-center justify-center rounded-full border border-background/40 bg-background/25 backdrop-blur-md transition group-hover:scale-110 md:size-20">
                <Play className="ml-1 size-7 fill-background text-background" />
              </span>
              <span className="absolute bottom-5 left-5 right-5 md:bottom-8 md:left-8">
                <span className="block text-xl font-bold text-background md:text-2xl">{v.title}</span>
                <span className="mt-1 block text-sm text-background/85">{v.body}</span>
              </span>
            </button>
          )}
        </div>
      </div>
    </section>
  );
}
