import { createFileRoute, Link } from "@tanstack/react-router";
import { ArrowLeft, ArrowRight, Stethoscope, HeartHandshake, CheckCheck, CalendarClock, Sparkles, Users, Phone, MessagesSquare } from "lucide-react";
import logo from "@/assets/nayuva-logo.png.asset.json";
import { BrandWordmark } from "@/components/brand-wordmark";

export const Route = createFileRoute("/perspectives")({
  head: () => ({
    meta: [
      { title: "Choose Your Perspective — Nayuva AI Live Demo" },
      { name: "description", content: "Explore Nayuva AI as a newborn care team or as a family at home. See how one continuous conversation connects both after discharge." },
      { property: "og:title", content: "Choose Your Perspective — Nayuva AI" },
      { property: "og:description", content: "Experience connected newborn care as a care team or as a caregiver." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: Perspectives,
});

function CareTeamArt() {
  return (
    <div className="psp-art" aria-hidden="true">
      <div className="psp-list">
        {["Janvi", "Saira", "Rehaan"].map((n, i) => (
          <div key={n} className="psp-row" style={{ animationDelay: `${i * 0.25}s` }}>
            <span className="psp-dot">{n[0]}</span><span className="psp-line" />
            {i === 0 && <b className="psp-badge">2</b>}
          </div>
        ))}
      </div>
      <div className="psp-chat">
        <span className="psp-bubble in">New photo shared</span>
        <span className="psp-bubble out">Thanks, reviewing now <CheckCheck className="size-3" /></span>
        <span className="psp-bubble card"><CalendarClock className="size-3" /> Visit approved</span>
      </div>
    </div>
  );
}

function CaregiverArt() {
  return (
    <div className="psp-art psp-art-family" aria-hidden="true">
      <div className="psp-banner"><Phone className="size-3.5" /> Today's check-in · 6:00 PM</div>
      <div className="psp-chat">
        <span className="psp-bubble out">Is this feeding pattern normal?</span>
        <span className="psp-bubble in">Your care team has replied</span>
        <span className="psp-bubble card"><Sparkles className="size-3" /> Answer from your baby's records</span>
      </div>
    </div>
  );
}

const roles = [
  {
    key: "team",
    eyebrow: "For hospitals & clinicians",
    title: "Care Team",
    Icon: Stethoscope,
    body: "Follow every discharged newborn in one place. See what's new at a glance, reply in real time and approve follow-ups without leaving the conversation.",
    points: [
      { Icon: Users, text: "All your families, with live unread signals" },
      { Icon: MessagesSquare, text: "Real-time chat with records, photos and history" },
      { Icon: Sparkles, text: "Sutra AI answers from reviewed records and helps schedule" },
    ],
    cta: "Continue as Care Team",
    Art: CareTeamArt,
  },
  {
    key: "family",
    eyebrow: "For parents & caregivers",
    title: "Caregiver",
    Icon: HeartHandshake,
    body: "Stay close to your baby's care team from home. Ask anything, share updates in your language and know exactly when the next visit is.",
    points: [
      { Icon: MessagesSquare, text: "A direct line to your baby's care team" },
      { Icon: Phone, text: "Daily check-ins by call or on the website" },
      { Icon: CalendarClock, text: "Upcoming visits and past summaries in one place" },
    ],
    cta: "Continue as Caregiver",
    Art: CaregiverArt,
  },
] as const;

function Perspectives() {
  return (
    <main className="page-shell psp-page">
      <header className="psp-top">
        <Link to="/" className="psp-back"><ArrowLeft className="size-4" /> Back to home</Link>
        <Link to="/" className="flex items-center gap-2.5" aria-label="Nayuva AI home">
          <img src={logo.url} alt="Nayuva AI logo" className="site-logo-image" width={36} height={36} />
          <BrandWordmark className="text-lg" />
        </Link>
        <span className="psp-spacer" />
      </header>
      <section className="psp-intro">
        <p className="eyebrow">Live demo</p>
        <h1>Choose your perspective</h1>
        <p>Nayuva connects two sides of the same newborn's care. Step in as either one.</p>
      </section>
      <section className="psp-grid">
        {roles.map((r, i) => (
          <article key={r.key} className={`psp-card glass psp-${r.key}`} style={{ animationDelay: `${i * 0.12}s` }}>
            <div className="flex items-center gap-3">
              <span className="psp-icon"><r.Icon className="size-5" /></span>
              <span className="eyebrow">{r.eyebrow}</span>
            </div>
            <h2>{r.title}</h2>
            <p className="psp-body">{r.body}</p>
            <r.Art />
            <ul className="psp-points">
              {r.points.map((pt) => <li key={pt.text}><pt.Icon className="size-4" />{pt.text}</li>)}
            </ul>
            {r.key === "team" ? (
              <Link to="/care-team/$section" params={{ section: "converse" }} className="psp-cta">{r.cta}<ArrowRight className="size-4" /></Link>
            ) : (
              <Link to="/caregiver-entry" className="psp-cta">{r.cta}<ArrowRight className="size-4" /></Link>
            )}
          </article>
        ))}
      </section>
      <p className="psp-note">Pre-configured demo profiles · Synthetic data only · No account needed</p>
    </main>
  );
}
