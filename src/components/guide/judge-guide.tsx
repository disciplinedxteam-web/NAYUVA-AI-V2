import { Link } from "@tanstack/react-router";
import { ArrowLeft, ArrowRight, MessagesSquare, Sparkles } from "lucide-react";
import logo from "@/assets/nayuva-logo.png.asset.json";
import GlassmorphismCta from "@/components/ui/glassmorphism-cta";
import { Button } from "@/components/ui/button";
import { WorkspaceHeading } from "@/components/care/workspace-heading";
import { ConverseDemo, SutraDemo, type DemoVariant } from "@/components/platform-demos";

export type GuideContent = {
  description: string; variant: Exclude<DemoVariant, "home">;
  converseLine: string; sutraLine: string; points: string[];
  tutorialLine: string; tutorialLabel: string; tutorialUrl: string; continueLabel: string;
};

// Shown every time a judge enters a perspective; nothing is remembered between visits.
export function JudgeGuide({ content, onContinue }: { content: GuideContent; onContinue: () => void }) {
  return (
    <main className="page-shell jg-page">
      <div className="jg-inner">
        <WorkspaceHeading title="Guide for Judges" description={content.description} />
        <section className="jg-demos" aria-label="What it looks like">
          <article className="jg-demo">
            <h2><span className="pillar-icon"><MessagesSquare className="size-4" /></span>Care Connect<small>{content.converseLine}</small></h2>
            <ConverseDemo variant={content.variant} />
          </article>
          <article className="jg-demo">
            <h2><span className="pillar-icon"><Sparkles className="size-4" /></span>Sutra AI<small>{content.sutraLine}</small></h2>
            <SutraDemo variant={content.variant} />
          </article>
        </section>
        <section className="jg-points" aria-label="What you can do">
          <ul>{content.points.map((t) => <li key={t}>{t}</li>)}</ul>
        </section>
        <section className="jg-tutorial-block">
          <p>{content.tutorialLine}</p>
          <div className="jg-tutorial-glow">
            <GlassmorphismCta className="jg-tutorial" href={content.tutorialUrl} target="_blank" rel="noopener noreferrer" aria-label={`${content.tutorialLabel} (opens YouTube)`} title={content.tutorialLabel} label={content.tutorialLabel} avatarSrc={logo.url} />
          </div>
        </section>
      </div>
      <footer className="jg-bottom">
        <Button asChild variant="outline" className="jg-back"><Link to="/"><ArrowLeft className="size-4" /> Back to website</Link></Button>
        <p className="psp-note">Synthetic demo profiles only · No account needed</p>
        <Button className="jg-continue" onClick={onContinue}>{content.continueLabel} <ArrowRight className="size-4" /></Button>
      </footer>
    </main>
  );
}
