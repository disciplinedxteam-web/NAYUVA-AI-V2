import { Link } from "@tanstack/react-router";
import { ArrowLeft, ArrowRight, MessagesSquare, Sparkles, type LucideIcon } from "lucide-react";
import logo from "@/assets/nayuva-logo.png.asset.json";
import { BrandWordmark } from "@/components/brand-wordmark";
import GlassmorphismCta from "@/components/ui/glassmorphism-cta";
import { useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';

export type GuideProduct = { title: string; tagline: string; points: string[] };
export type GuideContent = {
  eyebrow: string; title: string; intro: string; tutorialLabel: string; tutorialUrl: string;
  converse: GuideProduct; sutra: GuideProduct; steps: string[];
};

const icons: Record<"converse" | "sutra", LucideIcon> = { converse: MessagesSquare, sutra: Sparkles };

// Shown every time a judge enters a perspective; nothing is remembered between visits.
export function JudgeGuide({ content, onContinue, backTo }: { content: GuideContent; onContinue: () => void; backTo: "/" | "/caregiver-entry" }) {
  const [step, setStep] = useState(0);
  useEffect(() => { if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return; const timer = setInterval(() => setStep(s => (s + 1) % content.steps.length), 3200); return () => clearInterval(timer); }, [content.steps.length]);
  return (
    <main className="page-shell jg-page">
      <header className="jg-top">
        <Link to="/" className="flex items-center gap-2.5" aria-label="Nayuva AI home">
          <img src={logo.url} alt="Nayuva AI logo" className="site-logo-image" width={36} height={36} />
          <BrandWordmark className="text-lg" />
        </Link>
        <GlassmorphismCta className="jg-tutorial" href={content.tutorialUrl} target="_blank" rel="noopener noreferrer" aria-label={`${content.tutorialLabel} (opens YouTube)`} title={content.tutorialLabel} label={content.tutorialLabel} avatarSrc={logo.url} />
      </header>
      <section className="jg-intro">
        <p className="eyebrow">{content.eyebrow}</p>
        <h1>{content.title}</h1>
        <p>{content.intro}</p>
      </section>
      <section className="jg-grid">
        {(["converse", "sutra"] as const).map((k) => {
          const p = content[k]; const Icon = icons[k];
          return (
            <article key={k} className="jg-card">
              <div className="flex items-center gap-3"><span className="pillar-icon"><Icon className="size-5" /></span><div><h2>{p.title}</h2><small>{p.tagline}</small></div></div>
              <ul>{p.points.map((t) => <li key={t}>{t}</li>)}</ul>
            </article>
          );
        })}
      </section>
      <section className="jg-steps" aria-label="How to test">
        <p className="eyebrow">How to test in two minutes</p>
        <ol>{content.steps.map((s, i) => <li key={s} className={step === i ? 'is-active' : ''}><Button variant="ghost" onClick={() => setStep(i)} aria-current={step === i ? 'step' : undefined}><span className="jg-step-number">{i + 1}</span><span>{s}</span></Button>{i < content.steps.length - 1 && <ArrowRight className="jg-step-arrow" aria-hidden="true" />}</li>)}</ol>
      </section>
      <div className="jg-actions">
        <Button className="jg-continue" onClick={onContinue}>Okay, I understand <ArrowRight className="size-4" /></Button>
      </div>
      <div className="jg-bottom"><Link to={backTo} className="psp-back"><ArrowLeft className="size-4" /> Back</Link><p className="psp-note">Synthetic demo profiles only · No account needed</p></div>
    </main>
  );
}
