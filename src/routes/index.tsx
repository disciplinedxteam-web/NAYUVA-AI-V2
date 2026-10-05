import { createFileRoute } from "@tanstack/react-router";
import {
  ArrowRight,
  ArrowUpRight,
  Check,
  HeartHandshake,
  ClipboardList,
  Eye,
  CalendarCheck,
  Layers,
  MessageCircleHeart,
  CalendarClock,
  FileText,
  Route as RouteIcon,
  ShieldCheck,
} from "lucide-react";
import baby from "@/assets/baby-hands.png.asset.json";
import flowerA from "@/assets/flower-pink-right.png";
import flowerB from "@/assets/flower-pink-left.png";
import flowerLavender from "@/assets/flower-lavender.png";
import flowerYellow from "@/assets/flower-yellow.png";
import { CareGraphic } from "@/components/care-graphic";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Nayuva AI — Continuous care for newborns, beyond discharge" },
      {
        name: "description",
        content:
          "Nayuva AI connects newborns, caregivers and care teams after discharge — a clinician-directed platform for follow-up and continuity.",
      },
      { property: "og:title", content: "Nayuva AI — Continuous newborn care beyond discharge" },
      {
        property: "og:description",
        content: "Helping families stay guided and clinicians stay informed between visits.",
      },
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
    <a href="#" className="flex items-center gap-2.5">
      <img src={flowerB} alt="" className="size-9" width={1024} height={1024} />
      <span className="text-xl font-semibold tracking-[0.18em] text-primary">NAYUVA AI</span>
    </a>
  );
}

function Nav() {
  const links = ["Solution", "Products", "Impact", "Team"];
  return (
    <header className="relative z-30 mx-auto flex max-w-7xl items-center justify-between px-6 py-5 lg:px-10">
      <Logo />
      <nav className="hidden items-center gap-10 md:flex">
        {links.map((l) => (
          <a
            key={l}
            href={`#${l.toLowerCase()}`}
            className="text-sm font-medium text-foreground/70 transition-colors hover:text-primary"
          >
            {l}
          </a>
        ))}
      </nav>
      <a
        href="#cta"
        className="inline-flex items-center gap-2 rounded-full bg-primary px-5 py-2.5 text-sm font-semibold text-primary-foreground shadow-soft transition hover:bg-primary-deep"
      >
        Get Started <ArrowRight className="size-4" />
      </a>
    </header>
  );
}

function CTAs() {
  return (
    <div className="flex flex-wrap items-center gap-8">
      <a
        href="#cta"
        className="inline-flex items-center gap-3 rounded-full bg-primary px-7 py-4 text-sm font-semibold text-primary-foreground shadow-soft transition hover:bg-primary-deep"
      >
        Continue as Care Team <ArrowRight className="size-4" />
      </a>
      <a
        href="#cta"
        className="group inline-flex items-center gap-3 border-b border-primary/50 pb-1 text-sm font-semibold text-primary transition hover:border-primary"
      >
        Continue as Caregiver
        <ArrowRight className="size-4 transition group-hover:translate-x-1" />
      </a>
    </div>
  );
}

function Hero() {
  return (
    <section className="hero-section relative">
      <Flower src={flowerA} className="flower-edge flower-right hero-flower-right" />
      <Flower src={flowerB} className="flower-edge flower-left hero-flower-left" />
      <div className="mx-auto grid max-w-7xl items-center hero-layout gap-8 px-6 pb-12 pt-5 lg:grid-cols-[1.1fr_1fr] lg:px-10 lg:pt-6">
        <div className="hero-copy relative z-10 space-y-5">
          <div className="flex items-center gap-4">
            <span className="h-px w-10 bg-primary/60" />
            <span className="eyebrow">Newborn post-discharge care</span>
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
            A clinician-directed platform for newborn post-discharge care, follow-up and
            continuity.
          </p>
          <CTAs />
        </div>
        <div className="relative flex justify-center">
          
          <img
            src={baby.url}
            alt="A newborn swaddled in pink, cradled in caring hands"
            className="relative w-full max-w-[440px] mix-blend-multiply"
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

const ringIcon =
  "relative flex size-12 items-center justify-center rounded-full border border-primary/25 text-primary before:absolute before:-inset-2 before:rounded-full before:border before:border-primary/10";

function Solution() {
  return (
    <section id="solution" className="section-band relative py-14 md:py-20">
      <Flower src={flowerLavender} className="flower-edge flower-left solution-flower" />
      <div className="mx-auto max-w-5xl px-6">
        <SectionHead
          eyebrow="The Solution"
          title="Keeping newborn care connected, wherever care happens."
          body="Nayuva provides a continuous layer between the care team and home — connecting caregiver updates, follow-ups, appointments and clinical documentation in one care journey."
        />
        <div className="solution-grid grid grid-cols-6 gap-4">
          {[
            { kind: "home", title: "Guided Home Care", body: "Keeps caregivers connected to their clinician-defined care plan after discharge." },
            { kind: "updates", title: "Structured Care Updates", body: "Turns caregiver conversations into clear, structured information for the care team." },
            { kind: "visibility", title: "Care-Team Visibility", body: "Gives clinicians a connected view of what happens between visits." },
            { kind: "followup", title: "Follow-Up Coordination", body: "Keeps appointments, reminders and next steps connected to the care journey." },
            { kind: "record", title: "Longitudinal Record", body: "Brings care plans, updates, appointments and clinical notes together over time." },
          ].map((item, i) => (
            <div key={item.kind} className={`care-card glass col-span-full rounded-2xl p-6 text-left ${i < 3 ? "md:col-span-2" : "md:col-span-3"}`}>
              <CareGraphic kind={item.kind as "home" | "updates" | "visibility" | "followup" | "record"} />
              <h3 className="mt-6 text-lg font-semibold">{item.title}</h3>
              <p className="mt-3 text-sm leading-relaxed text-muted-foreground">{item.body}</p>
            </div>
          ))}
        </div>
        <p className="mx-auto mt-8 flex max-w-xl items-center justify-center gap-3 text-center text-sm font-medium text-primary-deep">
          <ShieldCheck className="size-5 shrink-0" />
          AI supports communication and documentation. Clinical decisions remain with the care team.
        </p>
      </div>
    </section>
  );
}

const products = [
  {
    name: "SVARA",
    tag: "Caregiver connection",
    Icon: MessageCircleHeart,
    body: "A multilingual voice and text assistant that keeps caregivers engaged with their care plan and captures home updates.",
    bullets: ["Voice and text, in the family's language", "Keeps the care plan close at home", "Captures home updates for the team"],
    preview: ["“Baby fed well today, 7 feeds.”", "Update shared with care team"],
  },
  {
    name: "MILAN",
    tag: "Follow-up coordination",
    Icon: CalendarClock,
    body: "Keeps appointments, reminders and follow-up communication connected to the care team's plan.",
    bullets: ["Appointment scheduling and reminders", "Follow-up communication in one place", "Aligned with the care team's plan"],
    preview: ["Follow-up · Thu, 10:30", "Reminder sent to caregiver"],
  },
  {
    name: "LEKHA",
    tag: "Clinical documentation",
    Icon: FileText,
    body: "Converts clinical conversations and appointment outcomes into structured documentation with less manual effort.",
    bullets: ["Conversations to structured notes", "Appointment outcomes captured", "Less manual documentation effort"],
    preview: ["Visit summary drafted", "Ready for clinician review"],
  },
  {
    name: "SUTRA",
    tag: "Longitudinal care journey",
    Icon: RouteIcon,
    body: "Connects care plans, Health Cards, appointments and clinical notes into one continuous record.",
    bullets: ["Care plans and Health Cards", "Appointments and clinical notes", "One continuous record over time"],
    preview: ["Journey · Day 1 → Week 6", "12 connected entries"],
  },
];

function Products() {
  return (
    <section id="products" className="section-band relative py-14 md:py-20">
      <Flower src={flowerA} className="flower-edge flower-right product-flower" />
      <div className="mx-auto max-w-5xl px-6">
        <SectionHead
          eyebrow="Products"
          title="Purpose-built for continuous newborn care."
          body="Four connected products support the caregiver, care team and every stage of the post-discharge journey."
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
                        <span className="flex size-[18px] items-center justify-center rounded-md bg-primary text-primary-foreground">
                          <Check className="size-2.5" />
                        </span>
                        {b}
                      </li>
                    ))}
                  </ul>
                </div>
                <div className="flex flex-1 justify-center">
                  <div className="glass relative aspect-[4/3] w-full overflow-hidden rounded-3xl md:max-w-sm">

                    <div className="absolute inset-0 flex flex-col justify-center gap-3 p-8">
                      <span className="text-6xl font-extrabold tracking-[0.1em] text-primary/15">{p.name}</span>
                      {p.preview.map((t, j) => (
                        <div key={t} className="flex items-center gap-3 rounded-xl border border-primary/10 bg-background/80 px-4 py-3 text-sm">
                          <span className={`size-2 rounded-full ${j ? "bg-primary/40" : "bg-primary"}`} />
                          {t}
                        </div>
                      ))}
                    </div>
                  </div>
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

function Impact() {
  return (
    <section id="impact" className="section-band relative py-14 md:py-20">
      <Flower src={flowerYellow} className="flower-edge flower-left impact-flower" />
      <div className="mx-auto max-w-5xl px-6">
        <SectionHead eyebrow="Impact" title="Making continuity of care measurable." body="Nayuva is designed to strengthen the connection between families and care teams after discharge." />
        <div className="impact-grid grid grid-cols-1 gap-4 md:grid-cols-3">
          <div className="care-card impact-feature rounded-2xl p-7 md:col-span-2 md:row-span-2 md:p-9">
            <p className="eyebrow">Continuity</p>
            <CareGraphic kind="continuity" large />
            <h3 className="text-3xl font-bold leading-tight md:text-4xl">Care that continues<br />after discharge.</h3>
            <p className="mt-4 max-w-md leading-relaxed text-muted-foreground">More consistent care between discharge and follow-up.</p>
          </div>
          <div className="care-card impact-visibility rounded-2xl p-6">
            <CareGraphic kind="visibility" />
            <h3 className="mt-5 text-lg font-semibold">Visibility</h3>
            <p className="mt-2 text-sm leading-relaxed text-muted-foreground">Better visibility into what happens between clinical visits.</p>
          </div>
          <div className="care-card impact-followup rounded-2xl p-6">
            <CareGraphic kind="followup" />
            <h3 className="mt-5 text-lg font-semibold">Follow-up</h3>
            <p className="mt-2 text-sm leading-relaxed text-muted-foreground">More connected coordination of appointments and next steps.</p>
          </div>
          <div className="care-card impact-efficiency rounded-2xl p-6">
            <CareGraphic kind="efficiency" />
            <h3 className="mt-5 text-lg font-semibold">Efficiency</h3>
            <p className="mt-2 text-sm leading-relaxed text-muted-foreground">Less manual effort in communication and clinical documentation.</p>
          </div>
          <a href="#cta" className="care-card impact-outcome relative rounded-2xl p-7 md:col-span-2">
            <p className="eyebrow">Outcome</p>
            <CareGraphic kind="support" />
            <h3 className="max-w-lg text-xl font-semibold leading-relaxed">Better-connected care can help families stay supported and care teams stay informed.</h3>
            <ArrowUpRight className="absolute right-6 top-6 size-5 text-primary" />
          </a>
        </div>
      </div>
    </section>
  );
}

const team = [
  { name: "Raksha H", role: "UI/UX Designer", initials: "RH" },
  { name: "Rajeev S", role: "Technical Leader", initials: "RS" },
  { name: "Dr Charmi S", role: "Clinical Head", initials: "CS" },
  { name: "Varun Viyas", role: "Backend Developer", initials: "VV" },
];

function Team() {
  return (
    <section id="team" className="section-band relative py-14 md:py-20">
      <Flower src={flowerLavender} className="flower-edge flower-right team-flower" />
      <div className="mx-auto max-w-6xl px-6">
        <div className="mb-10 flex flex-col gap-6 md:flex-row md:items-end md:justify-between">
          <div className="max-w-2xl">
            <span className="mb-4 block text-lg font-medium tracking-[0.5em] text-primary">O U R &nbsp;T E A M</span>
            <h2 className="text-4xl font-bold leading-tight tracking-tight md:text-5xl">
              Building the connection between discharge and home.
            </h2>
          </div>
          <p className="max-w-sm leading-relaxed text-muted-foreground">
            We're building technology that helps newborn care continue beyond the hospital — keeping
            families connected to their care teams when continuity matters most.
          </p>
        </div>
        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
          {team.map((m, i) => (
            <div key={m.name} className="glass group relative flex flex-col items-center overflow-hidden rounded-3xl p-8 text-center transition duration-300 hover:-translate-y-1">
              <div
                className="absolute inset-x-0 bottom-0 h-1/2 origin-bottom scale-y-0 rounded-t-full bg-gradient-to-t from-primary/20 to-transparent transition-transform duration-500 group-hover:scale-y-100"
                style={{ transitionDelay: `${i * 50}ms` }}
              />
              <div className="relative flex size-32 items-center justify-center overflow-hidden rounded-full border-4 border-background bg-blush transition duration-500 group-hover:scale-105 group-hover:border-primary">

                <span className="relative text-3xl font-bold tracking-wider text-primary-deep">{m.initials}</span>
              </div>
              <h3 className="relative mt-6 text-lg font-semibold">{m.name}</h3>
              <p className="relative text-sm text-muted-foreground">{m.role}</p>
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
          See how Nayuva brings caregivers and care teams together beyond discharge.
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
      <Solution />
      <Products />
      <Impact />
      <Team />
      <FinalCTA />
      <Footer />
    </main>
  );
}
