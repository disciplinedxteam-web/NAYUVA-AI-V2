import { createFileRoute, Link } from "@tanstack/react-router";
import { Button } from "@/components/ui/button";
import {
  ArrowRight,
  Check,
  MessageCircleHeart,
  FileText,
  Route as RouteIcon,
  Activity,
  CalendarClock,
  ShieldCheck,
} from "lucide-react";
import baby from "@/assets/baby-hands.png.asset.json";
import babyVideo from "@/assets/videos/hero-baby.mp4.asset.json";
import logo from "@/assets/nayuva-logo.png.asset.json";
import { BrandWordmark } from "@/components/brand-wordmark";
import flowerA from "@/assets/flower-pink-right.png";
import flowerB from "@/assets/flower-pink-left.png";
import flowerLavender from "@/assets/flower-lavender.png";
import { SiteHeader } from "@/components/site-header";
import { VideoShowcase } from "@/components/video-showcase";
import { CharacterVideo } from "@/components/care/character-video";
import { SvaraAnimation } from "@/components/care/svara-animation";
import { AwardBadge } from "@/components/ui/award-badge";
import raksha from "@/assets/raksha-portrait.png.asset.json";
import rajeev from "@/assets/rajeev-portrait.png.asset.json";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Nayuva AI — Connected newborn care between hospital and home" },
      { name: "description", content: "After a baby goes home, Nayuva AI keeps parents and the care team in one simple chat, with daily check-ins and quick answers from the baby's records." },
      { property: "og:title", content: "Nayuva AI — Newborn care that stays connected after discharge" },
      { property: "og:description", content: "One continuous conversation between families and care teams, from the hospital door through the first six weeks at home." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: Index,
});

function Flower({ src, className }: { src: string; className: string }) {
  return (
    <img
      src={src}
      alt=""
      aria-hidden
      width={1024}
      height={1024}
      loading="lazy"
      className={`pointer-events-none absolute select-none opacity-80 animate-sway ${className}`}
    />
  );
}

function Logo() {
  return (
    <a href="#" className="brand-spin flex items-center gap-2.5">
      <img src={logo.url} alt="Nayuva AI logo" className="site-logo-image" width={40} height={40} />
      <BrandWordmark className="text-xl" />
    </a>
  );
}

function Nav() { return <SiteHeader logo={<Logo />} />; }

function CTAs() {
  return (
    <div className="flex flex-wrap items-center gap-4">
      <Button asChild className="home-primary-cta group inline-flex items-center gap-3 rounded-full bg-primary px-7 py-4 text-sm font-semibold text-primary-foreground shadow-soft transition hover:bg-primary-deep">
        <Link to="/care-team-guide">Continue as Care Team <ArrowRight className="size-4 transition group-hover:translate-x-1" /></Link>
      </Button>
      <Button asChild variant="outline" className="home-secondary-cta group inline-flex items-center gap-3 rounded-full px-7 py-4 text-sm font-semibold">
        <Link to="/caregiver-entry">Continue as Caregiver <ArrowRight className="size-4 transition group-hover:translate-x-1" /></Link>
      </Button>
    </div>
  );
}

function Hero() {
  return (
    <section className="hero-section relative">
      <Flower src={flowerA} className="flower-edge flower-right hero-flower-right" />
      <Flower src={flowerB} className="flower-edge flower-left hero-flower-left" />
      <div className="hero-badge relative z-10 flex w-full justify-center px-6">
        <AwardBadge eyebrow="TEAM BAALAK 2.0" title="HackwithAditya" />
      </div>
      <div className="mx-auto grid max-w-7xl items-center hero-layout gap-10 px-6 lg:grid-cols-[1.1fr_1fr] lg:px-10">
        <div className="hero-copy relative z-10">
          <div className="flex items-center gap-4">
            <span className="h-px w-10 bg-primary/60" />
            <span className="eyebrow">Newborn continuity of care</span>
          </div>
          <h1 className="text-4xl font-bold leading-[1.1] md:text-5xl lg:text-[3.5rem]">
            Continuous care for newborns,{" "}
            <span className="font-light italic text-primary">beyond discharge.</span>
          </h1>
          <p className="max-w-lg text-lg leading-relaxed text-muted-foreground">
            After a baby goes home, Nayuva AI keeps parents and the care team in one simple chat,
            with daily check-ins and quick answers from the baby's records.
          </p>
          <CTAs />
        </div>
        <div className="relative flex justify-center">
          
          <video
            src={babyVideo.url}
            poster={baby.url}
            autoPlay
            loop
            muted
            playsInline
            disablePictureInPicture
            tabIndex={-1}
            aria-label="A newborn swaddled in pink, breathing gently in caring hands"
            className="hero-baby hero-baby-video relative w-full"
          />
        </div>
      </div>
    </section>
  );
}

function SectionHead({
  eyebrow,
  title,
  body,
  center = true,
}: {
  eyebrow: string;
  title: string;
  body?: string;
  center?: boolean;
}) {
  return (
    <div className={`mb-10 max-w-2xl ${center ? "mx-auto text-center" : ""}`}>
      <p className="eyebrow mb-3">{eyebrow}</p>
      <h2 className="text-4xl font-bold leading-tight tracking-tight md:text-5xl">{title}</h2>
      {body && <p className="mt-4 text-lg leading-relaxed text-muted-foreground">{body}</p>}
    </div>
  );
}

const products = [
  {
    name: "SVARA",
    tag: "Caregiver connection",
    Icon: MessageCircleHeart,
    body: 'A warm daily voice companion for families, on the phone or the website, in their own language.',
    bullets: ["Asks only the questions in today's Care Plan", 'Follows up on concerns from earlier check-ins', 'Repeats back what it heard to confirm', 'Creates a Health Card the caregiver approves'],
    state: "working",
  },
  {
    name: "MILAN",
    tag: "Follow-up coordination",
    Icon: CalendarClock,
    body: 'Turns a concern into a booked follow-up visit, in person or online, in one step.',
    bullets: ['Care team schedules date, time and visit type', 'Families see location or video join link instantly', 'Confirm or request a reschedule', 'Online visit summaries saved to past appointments'],
    state: "searching",
  },
  {
    name: "LEKHA",
    tag: "Clinical documentation",
    Icon: FileText,
    body: 'Listens during the consultation and drafts the visit summary for the clinician.',
    bullets: ['Records and separates who said what', 'Drafts an in-person consultation summary', 'Checklist of essential topics covered', "Nothing saved without the clinician's approval"],
    state: "lighthouse",
  },
  {
    name: "SUTRA",
    tag: "Longitudinal care journey",
    Icon: RouteIcon,
    body: "The memory of the baby's whole care journey, answering questions in the language asked.",
    bullets: ["Answers only from this baby's records", 'Summaries, lists and short clear replies', 'Links to the exact source documents', 'Listen to answers or ask by voice'],
    state: "reasoning",
  },
  {
    name: "TAAL",
    tag: "Caregiver adherence",
    Icon: Activity,
    body: 'Shows how consistently each family completes scheduled check-ins and visits.',
    bullets: ['7, 14, 28 and 42 day views', 'One-tap call or WhatsApp reminder', 'Spots families who may need a nudge', 'Measures activity, never clinical risk'],
    state: "working",
  },
];

function Products() {
  return (
    <section id="platform" className="section-band relative py-14 md:py-20">
      <Flower src={flowerA} className="flower-edge flower-right product-flower" />
      <div className="mx-auto max-w-5xl px-6">
        <SectionHead
          eyebrow="Products"
          title="Purpose-built for continuous newborn care."
          body="Five products, one story: Svara listens at home, the care team reviews, Milan books the follow-up, Lekha documents the visit, Sutra remembers it all, and Taal keeps the rhythm."
        />
        <div>
          {products.map((p, i) => (
            <div key={p.name}>
              <div className={`flex flex-col gap-10 py-10 md:items-center md:gap-14 ${i % 2 ? "md:flex-row-reverse" : "md:flex-row"}`}>
                <div className="flex flex-1 flex-col gap-6">
                  <div className="flex items-center gap-3">
                    <span className="flex size-8 items-center justify-center rounded-lg border border-primary/20 bg-blush/60">
                      <p.Icon className="size-4 text-primary" />
                    </span>
                    <span className="eyebrow">{p.tag}</span>
                  </div>
                  <h3 className="text-4xl font-extrabold tracking-[0.12em]">{p.name}</h3>
                  <p className="leading-relaxed text-muted-foreground">{p.body}</p>
                  <ul className="flex flex-col gap-3">
                    {p.bullets.map((b) => (
                      <li key={b} className="flex items-center gap-3 text-sm">
                        <span className="flex size-[18px] shrink-0 items-center justify-center rounded-md bg-primary text-primary-foreground">
                          <Check className="size-2.5" />
                        </span>
                        {b}
                      </li>
                    ))}
                  </ul>
                </div>
                <div className="min-w-0 flex-1">
                  {p.name === "SVARA" ? <div className="product-svara flex justify-center"><SvaraAnimation state="idle" /></div> : <div className="flex justify-center"><CharacterVideo clip={p.name === "TAAL" ? "taal" : p.name === "LEKHA" ? "lekha-writing" : p.name === "MILAN" ? "milan-writing" : "sutra-search"} size={360} /></div>}
                </div>
              </div>
              {i < products.length - 1 && <div className="h-px bg-primary/15" />}
            </div>
          ))}
        </div>
        <p className="mt-16 text-center text-xl font-semibold text-primary-deep">
          One connected platform. From home updates to clinical follow-up.
        </p>
      </div>
    </section>
  );
}

const team = [
  { name: "Raksha H", role: "UI/UX Designer", photo: raksha, framing: "raksha" },
  { name: "Rajeev Shukla", role: "Developer", photo: rajeev, framing: "rajeev" },
];

function Team() {
  return (
    <section id="team" className="section-band relative py-14 md:py-20">
      <Flower src={flowerLavender} className="flower-edge flower-right team-flower" />
      <div className="mx-auto max-w-6xl px-6">
        <SectionHead eyebrow="Our Team" title="The people behind Nayuva AI." body="We build simple tools that help newborn care continue after the hospital." />
        <div className="flex flex-wrap justify-center gap-6">
          {team.map((m) => (
            <div key={m.name} className="glass team-member group relative flex w-full flex-col sm:w-[calc((100%-1.5rem)/2)] lg:w-[calc((100%-4.5rem)/4)] items-center rounded-lg px-6 py-8 text-center">
              <div className="team-portrait relative flex size-36 items-center justify-center overflow-hidden rounded-full" data-framing={m.framing}>
                <img src={m.photo.url} alt={m.name} width={256} height={256} loading="lazy" />
              </div>
              <span className="team-divider" aria-hidden />
              <h3 className="relative mt-5 text-lg font-semibold">{m.name}</h3>
              <p className="relative mt-1 text-sm text-muted-foreground">{m.role}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

function FinalCTA() {
  return (
    <section id="cta" className="section-band relative py-14 md:py-20">
      <Flower src={flowerB} className="flower-edge flower-left cta-flower" />
      <div className="relative mx-auto max-w-5xl px-6 py-10 text-center">


        <p className="eyebrow relative mb-5">Get started</p>
        <h2 className="relative text-4xl font-bold tracking-tight md:text-6xl">
          Keep newborn care <span className="font-light italic text-primary">connected.</span>
        </h2>
        <p className="relative mx-auto mt-6 max-w-lg text-lg text-muted-foreground">
          Try it as the care team or as a parent.
        </p>
        <div className="relative mt-12 flex justify-center">
          <CTAs />
        </div>
      </div>
    </section>
  );
}

function Footer() {
  return (
    <footer className="border-t border-primary/15">
      <div className="mx-auto flex max-w-7xl flex-col gap-8 px-6 py-14 md:flex-row md:items-start md:justify-between lg:px-10">
        <div className="space-y-3">
          <Logo />
          <p className="text-sm text-muted-foreground">Continuous newborn post-discharge care.</p>
        </div>
        <p className="max-w-md text-xs leading-relaxed text-muted-foreground">
          Nayuva supports communication, coordination and documentation. It does not diagnose,
          recommend treatment, assess clinical risk or provide autonomous clinical advice.
        </p>
      </div>
      <p className="pb-8 text-center text-xs text-muted-foreground">© {new Date().getFullYear()} Nayuva AI</p>
    </footer>
  );
}

function Index() {
  return (
    <main className="page-shell">
      <Nav />
      <Hero />
      <VideoShowcase />
      <Products />
      <Team />
      <FinalCTA />
      <Footer />
    </main>
  );
}
