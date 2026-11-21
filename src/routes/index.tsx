import { createFileRoute, Link } from "@tanstack/react-router";
import { Button } from "@/components/ui/button";
import {
  ArrowRight,
  ArrowUpRight,
  Check,
  CheckCheck,
  MessagesSquare,
  Sparkles,
  CalendarClock,
  ShieldCheck,
  Paperclip,
  Languages,
} from "lucide-react";
import baby from "@/assets/baby-hands.png.asset.json";
import babyVideo from "@/assets/videos/hero-baby.mp4.asset.json";
import logo from "@/assets/nayuva-logo.png.asset.json";
import { BrandWordmark } from "@/components/brand-wordmark";
import flowerA from "@/assets/flower-pink-right.png";
import flowerB from "@/assets/flower-pink-left.png";
import flowerLavender from "@/assets/flower-lavender.png";
import flowerYellow from "@/assets/flower-yellow.png";
import { CareGraphic } from "@/components/care-graphic";
import { SiteHeader } from "@/components/site-header";
import { VideoShowcase } from "@/components/video-showcase";
import { AwardBadge } from "@/components/ui/award-badge";
import raksha from "@/assets/raksha-portrait.png.asset.json";
import rajeev from "@/assets/rajeev-portrait.png.asset.json";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Nayuva AI — Connected newborn care between hospital and home" },
      { name: "description", content: "Nayuva AI keeps families and newborn care teams in one continuous, real-time conversation after discharge, with record-grounded guidance and follow-ups booked in moments." },
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
    <div className="flex flex-wrap items-center gap-6">
      <Button asChild className="home-primary-cta group inline-flex items-center gap-3 rounded-full bg-primary px-8 py-4 text-sm font-semibold text-primary-foreground shadow-soft transition hover:bg-primary-deep">
        <Link to="/perspectives">Experience Connected Care <ArrowRight className="size-4 transition group-hover:translate-x-1" /></Link>
      </Button>
      <span className="text-xs font-medium text-foreground/55">Live demo · No sign-up needed</span>
    </div>
  );
}

function Hero() {
  return (
    <section className="hero-section relative">
      <Flower src={flowerA} className="flower-edge flower-right hero-flower-right" />
      <Flower src={flowerB} className="flower-edge flower-left hero-flower-left" />
      <div className="hero-badge relative z-10 flex w-full justify-center px-6">
        <a href="https://reskilll.com/hack/nexconn" target="_blank" rel="noreferrer" aria-label="NexConn Build Challenge — Team Bhavishya"><AwardBadge eyebrow="TEAM BHAVISHYA" title="NexConn Build Challenge" /></a>
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
          <p className="max-w-xl text-lg leading-relaxed text-muted-foreground">
            Nayuva AI connects newborns, caregivers and care teams after discharge, helping
            families stay guided and helping clinicians stay informed between visits.
          </p>
          <p className="max-w-md text-sm font-medium text-foreground/60">
            The weeks after discharge are when families have the most questions and care teams
            have the least visibility. Nayuva keeps both in one continuous, clinician-directed conversation.
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

function Solution() {
  return (
    <section id="solution" className="section-band relative py-14 md:py-20">
      <Flower src={flowerLavender} className="flower-edge flower-left solution-flower" />
      <div className="mx-auto max-w-5xl px-6">
        <SectionHead
          eyebrow="The Solution"
          title="Discharge shouldn't be the moment the conversation stops."
          body="Today, families leave with a printed sheet and a phone number, and care teams wait weeks to learn what happened at home. Nayuva replaces that silence with one living line of communication around every newborn."
        />
        <div className="solution-grid grid grid-cols-6 gap-4">
          {[
            { kind: "home", title: "Guidance from day one", body: "Before the family leaves, the care team sets the baby's care plan. Every day at home is guided by it, in the family's own language." },
            { kind: "updates", title: "Every voice, kept in context", body: "Messages, photos, voice notes and daily check-ins arrive in one thread, with each parent's own words kept beside every structured update." },
            { kind: "visibility", title: "Clinicians see change early", body: "Read receipts, unread signals and review states show care teams what is new, so nothing at home is silently marked as routine." },
            { kind: "followup", title: "From concern to visit in moments", body: "When something needs a closer look, a follow-up is proposed, approved and shared in the same conversation, in person or online." },
            { kind: "record", title: "One continuous story", body: "Conversations, check-ins and visit summaries build a single journey, so every answer can be traced back to the record it came from." },
          ].map((item, i) => (
            <div key={item.kind} className={`care-card glass col-span-full rounded-2xl p-6 text-left ${i < 3 ? "md:col-span-2" : "md:col-span-3"}`}>
              <CareGraphic kind={item.kind as "home" | "updates" | "visibility" | "followup" | "record"} />
              <h3 className="mt-6 text-lg font-semibold">{item.title}</h3>
              <p className="mt-3 text-sm leading-relaxed text-muted-foreground">{item.body}</p>
            </div>
          ))}
        </div>
        <p className="solution-note mx-auto mt-8 flex w-fit items-center justify-center gap-3 text-center text-sm font-medium text-primary-deep">
          <ShieldCheck className="size-5 shrink-0" />
          AI supports communication and documentation. Clinical decisions remain with the care team.
        </p>
      </div>
    </section>
  );
}

function ConverseDemo() {
  return (
    <div className="pillar-demo" aria-hidden="true">
      <div className="pd-head"><span className="pd-avatar">CT</span><span><strong>Care Team</strong><small><i className="pd-live" />online</small></span></div>
      <div className="pd-msg pd-in" style={{ animationDelay: "0.2s" }}>Feeding well today? Share a photo of the latch if you can.</div>
      <div className="pd-msg pd-out" style={{ animationDelay: "1.2s" }}><span className="pd-quote">Feeding well today?</span>Yes, every 3 hours. Photo attached. <CheckCheck className="pd-tick" /></div>
      <div className="pd-msg pd-in pd-card" style={{ animationDelay: "2.2s" }}><CalendarClock className="size-4" /> Follow-up · Thu 10:30 · In person</div>
      <div className="pd-typing" style={{ animationDelay: "3.2s" }}><i /><i /><i /></div>
    </div>
  );
}

function SutraDemo() {
  return (
    <div className="pillar-demo" aria-hidden="true">
      <div className="pd-msg pd-out" style={{ animationDelay: "0.2s" }}>बच्ची का वज़न पिछले हफ़्ते कैसा था?</div>
      <div className="pd-msg pd-in pd-answer" style={{ animationDelay: "1.3s" }}>
        <span className="pd-lines"><i /><i /><i style={{ width: "62%" }} /></span>
        <span className="pd-sources"><b>Day 7 check-in</b><b>Visit summary</b></span>
      </div>
      <div className="pd-msg pd-in pd-card" style={{ animationDelay: "2.4s" }}><CalendarClock className="size-4" /> Proposed visit · Approve</div>
    </div>
  );
}

const pillars = [
  {
    key: "converse",
    eyebrow: "Real-time care conversation",
    title: "Converse",
    Icon: MessagesSquare,
    body: "A private, always-open line between each family and their newborn's care team, built for the first six weeks at home.",
    points: [
      { Icon: CheckCheck, text: "Live delivery and read receipts" },
      { Icon: Paperclip, text: "Photos, documents, voice and camera" },
      { Icon: CalendarClock, text: "Appointments and daily check-ins in the thread" },
      { Icon: MessagesSquare, text: "Replies, reactions and full visit history" },
    ],
    Demo: ConverseDemo,
  },
  {
    key: "sutra",
    eyebrow: "Record-grounded care assistant",
    title: "Sutra AI",
    Icon: Sparkles,
    body: "Answers questions about one baby's journey, only from reviewed records, and helps the care team arrange follow-ups.",
    points: [
      { Icon: Languages, text: "Replies in the language and script you write in" },
      { Icon: ShieldCheck, text: "Every answer linked to its source record" },
      { Icon: CalendarClock, text: "Follow-ups proposed, booked only on approval" },
      { Icon: Sparkles, text: "Never diagnoses or gives clinical advice" },
    ],
    Demo: SutraDemo,
  },
];

function Products() {
  return (
    <section id="platform" className="section-band relative py-14 md:py-20">
      <Flower src={flowerA} className="flower-edge flower-right product-flower" />
      <div className="mx-auto max-w-6xl px-6">
        <SectionHead
          eyebrow="The Platform"
          title="Two ways to stay connected. One shared record."
          body="Families and care teams talk in real time. Sutra AI makes sense of everything they've shared. Both draw from the same reviewed journey."
        />
        <div className="pillar-grid">
          {pillars.map((p) => (
            <article key={p.key} className={`pillar glass pillar-${p.key}`}>
              <div className="pillar-copy">
                <div className="flex items-center gap-3">
                  <span className="pillar-icon"><p.Icon className="size-5" /></span>
                  <span className="eyebrow">{p.eyebrow}</span>
                </div>
                <h3 className="mt-5 text-3xl font-bold tracking-tight md:text-4xl">{p.title}</h3>
                <p className="mt-3 leading-relaxed text-muted-foreground">{p.body}</p>
              </div>
              <p.Demo />
              <ul className="pillar-points">
                {p.points.map((pt) => (
                  <li key={pt.text}><pt.Icon className="size-4" />{pt.text}</li>
                ))}
              </ul>
            </article>
          ))}
        </div>
        <p className="mt-12 text-center text-xl font-semibold text-primary-deep">
          One connected platform, from the first night home to the six-week visit.
        </p>
      </div>
    </section>
  );
}

function Impact() {
  return (
    <section id="impact" className="section-band relative py-14 md:py-20">
      <Flower src={flowerYellow} className="flower-edge flower-left impact-flower" />
      <div className="mx-auto max-w-5xl px-6">
        <SectionHead eyebrow="Impact" title="Continuity you can see, not just hope for." body="Every message, check-in and visit is captured in one place, so the weeks after discharge become visible to everyone caring for the baby." />
        <div className="impact-grid grid grid-cols-1 gap-4 md:grid-cols-3">
          <div className="care-card impact-feature rounded-2xl p-7 md:col-span-2 md:row-span-2 md:p-9">
            <p className="eyebrow">Continuity</p>
            <CareGraphic kind="continuity" large />
            <h3 className="text-3xl font-bold leading-tight md:text-4xl">No more silence<br />after discharge.</h3>
            <p className="mt-4 max-w-md leading-relaxed text-muted-foreground">Families can reach their care team any day, and are checked in with on schedule, so small changes are heard while they are still small.</p>
          </div>
          <div className="care-card impact-visibility rounded-2xl p-6">
            <CareGraphic kind="impact-visibility" />
            <h3 className="mt-5 text-lg font-semibold">Visibility</h3>
            <p className="mt-2 text-sm leading-relaxed text-muted-foreground">Unread signals and read receipts show care teams exactly what is new, in the family's own words.</p>
          </div>
          <div className="care-card impact-followup rounded-2xl p-6">
            <CareGraphic kind="impact-followup" />
            <h3 className="mt-5 text-lg font-semibold">Follow-up</h3>
            <p className="mt-2 text-sm leading-relaxed text-muted-foreground">A concern raised in chat becomes an approved visit in the same thread, with no phone tag.</p>
          </div>
          <div className="care-card impact-efficiency rounded-2xl p-6">
            <CareGraphic kind="efficiency" />
            <h3 className="mt-5 text-lg font-semibold">Efficiency</h3>
            <p className="mt-2 text-sm leading-relaxed text-muted-foreground">Record-grounded answers and drafted summaries give clinicians time back for care.</p>
          </div>
          <a href="#cta" className="care-card impact-outcome relative rounded-2xl p-7 md:col-span-2">
            <p className="eyebrow">Outcome</p>
            <CareGraphic kind="support" />
            <h3 className="max-w-lg text-xl font-semibold leading-relaxed">Families feel accompanied through the first six weeks, and care teams stay informed without extra calls or paperwork.</h3>
            <ArrowUpRight className="absolute right-6 top-6 size-5 text-primary" />
          </a>
        </div>
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
        <SectionHead eyebrow="Our Team" title="Building the connection between discharge and home." body="We're building technology that helps newborn care continue beyond the hospital — keeping families connected to their care teams when continuity matters most." />
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
          Step into the platform as a care team or a family, and see continuity in action.
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
      <Solution />
      <Products />
      <Impact />
      <Team />
      <FinalCTA />
      <Footer />
    </main>
  );
}
