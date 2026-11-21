import { Link } from "@tanstack/react-router";
import { ArrowLeft, ArrowRight, MessagesSquare, Sparkles, type LucideIcon } from "lucide-react";
import logo from "@/assets/nayuva-logo.png.asset.json";
import { BrandWordmark } from "@/components/brand-wordmark";
import GlassmorphismCta from "@/components/ui/glassmorphism-cta";

export type GuideProduct = { title: string; tagline: string; points: string[] };
export type GuideContent = {
  eyebrow: string; title: string; intro: string; tutorialLabel: string; tutorialUrl: string;
  converse: GuideProduct; sutra: GuideProduct; steps: string[];
};

const icons: Record<"converse" | "sutra", LucideIcon> = { converse: MessagesSquare, sutra: Sparkles };

// Shown every time a judge enters a perspective; nothing is remembered between visits.
export function JudgeGuide({ content, onContinue, backTo }: { content: GuideContent; onContinue: () => void; backTo: "/" | "/caregiver-entry" }) {
  return (
    <main className="page-shell jg-page">
      <header className="jg-top">
        <Link to={backTo} className="psp-back"><ArrowLeft className="size-4" /> Back</Link>
        <Link to="/" className="flex items-center gap-2.5" aria-label="Nayuva AI home">
          <img src={logo.url} alt="Nayuva AI logo" className="site-logo-image" width={36} height={36} />
          <BrandWordmark className="text-lg" />
        </Link>
        <span />
      </header>
      <section className="jg-intro">
        <div className="jg-orbit" aria-hidden="true"><span /><span /><img src={logo.url} alt="" /></div>
        <p className="eyebrow">{content.eyebrow}</p>
        <h1>{content.title}</h1>
        <p>{content.intro}</p>
      </section>
      <section className="jg-grid">
        {(["converse", "sutra"] as const).map((k, i) => {
          const p = content[k]; const Icon = icons[k];
          return (
            <article key={k} className="jg-card glass" style={{ animationDelay: `${0.1 + i * 0.12}s` }}>
              <div className="flex items-center gap-3"><span className="pillar-icon"><Icon className="size-5" /></span><div><h2>{p.title}</h2><small>{p.tagline}</small></div></div>
              <ul>{p.points.map((t) => <li key={t}>{t}</li>)}</ul>
            </article>
          );
        })}
      </section>
      <section className="jg-steps glass" aria-label="How to test">
        <p className="eyebrow">How to test in two minutes</p>
        <ol>{content.steps.map((s) => <li key={s}>{s}</li>)}</ol>
      </section>
      <div className="jg-actions">
        <GlassmorphismCta className="tutorial-tile" href={content.tutorialUrl} target="_blank" rel="noopener noreferrer" aria-label={`${content.tutorialLabel} (opens YouTube)`} title={content.tutorialLabel} label={content.tutorialLabel} avatarSrc={logo.url} />
        <button type="button" className="jg-continue" onClick={onContinue}>Okay, I understand <ArrowRight className="size-4" /></button>
      </div>
      <p className="psp-note">Synthetic demo profiles only · No account needed</p>
    </main>
  );
}
