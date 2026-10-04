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
import flowerA from "@/assets/flower-a.png";
import flowerB from "@/assets/flower-b.png";

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
    <header className="relative z-30 mx-auto flex max-w-7xl items-center justify-between px-6 py-7 lg:px-10">
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
    <section className="relative overflow-hidden">
      <Flower src={flowerA} className="-right-24 -top-10 w-[340px] rotate-[200deg]" />
      <Flower src={flowerA} className="-left-32 -bottom-24 w-[240px] rotate-12" />
      <div className="mx-auto grid max-w-7xl items-center gap-12 px-6 pb-28 pt-10 lg:grid-cols-[1.1fr_1fr] lg:px-10 lg:pt-16">
        <div className="relative z-10 space-y-9">
          <div className="flex items-center gap-4">
            <span className="h-px w-10 bg-primary/60" />
            <span className="eyebrow">Newborn post-discharge care</span>
          </div>
          <h1 className="text-5xl font-bold leading-[1.05] tracking-tight md:text-6xl lg:text-[4.2rem]">
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
          <div className="absolute inset-10 rounded-full bg-blush/70 blur-3xl" />
          <img
            src={baby.url}
            alt="A newborn swaddled in pink, cradled in caring hands"
            className="relative w-full max-w-[520px] mix-blend-multiply"
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
    <div className={`mb-20 max-w-2xl ${center ? "mx-auto text-center" : ""}`}>
      <p className="eyebrow mb-5">{eyebrow}</p>
      <h2 className="text-4xl font-bold leading-tight tracking-tight md:text-5xl">{title}</h2>
      {body && <p className="mt-6 text-lg leading-relaxed text-muted-foreground">{body}</p>}
    </div>
  );
}

const ringIcon =
  "relative flex size-12 items-center justify-center rounded-full border border-primary/25 text-primary before:absolute before:-inset-2 before:rounded-full before:border before:border-primary/10";

function Solution() {
  return (
    <section id="solution" className="relative py-32 md:py-40">
      <Flower src={flowerB} className="-left-10 top-20 w-44 -rotate-12" />
      <div className="mx-auto max-w-5xl px-6">
        <SectionHead
          eyebrow="The Solution"
          title="Keeping newborn care connected, wherever care happens."
          body="Nayuva provides a continuous layer between the care team and home — connecting caregiver updates, follow-ups, appointments and clinical documentation in one care journey."
        />
        <div className="grid grid-cols-6 gap-4">
          {/* Guided Home Care */}
          <div className="glass col-span-full flex flex-col items-center justify-center rounded-3xl p-10 text-center lg:col-span-2">
            <div className="relative flex h-24 w-56 items-center justify-center">
              <svg className="absolute inset-0 size-full text-primary/15" viewBox="0 0 254 104" fill="none">
                <ellipse cx="127" cy="52" rx="122" ry="46" stroke="currentColor" strokeWidth="6" />
              </svg>
              <HeartHandshake className="size-10 text-primary" strokeWidth={1.3} />
            </div>
            <h3 className="mt-6 text-2xl font-semibold">Guided Home Care</h3>
            <p className="mt-3 text-sm leading-relaxed text-muted-foreground">
              Keeps caregivers connected to their clinician-defined care plan after discharge.
            </p>
          </div>
          {/* Structured Care Updates */}
          <div className="glass col-span-full rounded-3xl p-8 sm:col-span-3 lg:col-span-2">
            <div className="relative mx-auto flex size-32 items-center justify-center rounded-full border border-primary/20 before:absolute before:-inset-2 before:rounded-full before:border before:border-primary/10">
              <ClipboardList className="size-12 text-primary" strokeWidth={1.1} />
            </div>
            <div className="mt-8 space-y-2 text-center">
              <h3 className="text-lg font-semibold">Structured Care Updates</h3>
              <p className="text-sm leading-relaxed text-muted-foreground">
                Turns caregiver conversations into clear, structured information for the care team.
              </p>
            </div>
          </div>
          {/* Care-Team Visibility */}
          <div className="glass col-span-full rounded-3xl p-8 sm:col-span-3 lg:col-span-2">
            <svg className="w-full text-primary" viewBox="0 0 386 123" fill="none">
              <defs>
                <linearGradient id="vis" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0" stopColor="currentColor" stopOpacity="0.2" />
                  <stop offset="1" stopColor="currentColor" stopOpacity="0" />
                </linearGradient>
              </defs>
              <path d="M3 110 C60 90 80 60 120 70 S190 100 230 60 S310 40 383 20 V123 H3Z" fill="url(#vis)" />
              <path d="M3 110 C60 90 80 60 120 70 S190 100 230 60 S310 40 383 20" stroke="currentColor" strokeWidth="3" />
              {[120, 230, 340].map((x, i) => (
                <circle key={x} cx={x} cy={[70, 60, 31][i]} r="6" fill="currentColor" />
              ))}
            </svg>
            <div className="mt-10 space-y-2 text-center">
              <h3 className="flex items-center justify-center gap-2 text-lg font-semibold">
                <Eye className="size-4 text-primary" /> Care-Team Visibility
              </h3>
              <p className="text-sm leading-relaxed text-muted-foreground">
                Gives clinicians a connected view of what happens between visits.
              </p>
            </div>
          </div>
          {/* Follow-Up Coordination */}
          <div className="glass col-span-full grid gap-6 overflow-hidden rounded-3xl p-8 sm:grid-cols-2 lg:col-span-3">
            <div className="flex flex-col justify-between gap-10">
              <div className={ringIcon}><CalendarCheck className="size-5" strokeWidth={1.4} /></div>
              <div className="space-y-2">
                <h3 className="text-lg font-semibold">Follow-Up Coordination</h3>
                <p className="text-sm leading-relaxed text-muted-foreground">
                  Keeps appointments, reminders and next steps connected to the care journey.
                </p>
              </div>
            </div>
            <div className="-mb-8 -mr-8 rounded-tl-2xl border-l border-t border-primary/15 bg-background/50 p-5 pt-8">
              {["Day 3 · Weight check", "Day 7 · Feeding review", "Week 2 · Paediatric visit"].map((t, i) => (
                <div key={t} className="mb-3 flex items-center gap-3 rounded-xl border border-primary/10 bg-background/70 px-3 py-2.5 text-xs">
                  <span className={`size-2 rounded-full ${i === 0 ? "bg-primary" : "bg-primary/30"}`} />
                  {t}
                </div>
              ))}
            </div>
          </div>
          {/* Longitudinal Record */}
          <div className="glass col-span-full grid gap-6 overflow-hidden rounded-3xl p-8 sm:grid-cols-2 lg:col-span-3">
            <div className="flex flex-col justify-between gap-10">
              <div className={ringIcon}><Layers className="size-5" strokeWidth={1.4} /></div>
              <div className="space-y-2">
                <h3 className="text-lg font-semibold">Longitudinal Record</h3>
                <p className="text-sm leading-relaxed text-muted-foreground">
                  Brings care plans, updates, appointments and clinical notes together over time.
                </p>
              </div>
            </div>
            <div className="relative flex flex-col justify-center gap-5 py-2 before:absolute before:inset-y-0 before:left-1/2 before:w-px before:bg-primary/20">
              {["Care plan", "Home update", "Clinical note"].map((t, i) => (
                <div key={t} className={`relative flex items-center gap-2 ${i % 2 ? "ml-[calc(50%-0.4rem)]" : "w-[calc(50%+0.4rem)] flex-row-reverse"}`}>
                  <span className="size-3 rounded-full bg-primary ring-4 ring-background" />
                  <span className="rounded-md border border-primary/15 bg-background/70 px-2 py-1 text-xs">{t}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
        <p className="mx-auto mt-16 flex max-w-xl items-center justify-center gap-3 text-center text-sm font-medium text-primary-deep">
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
    <section id="products" className="relative py-32 md:py-40">
      <Flower src={flowerA} className="-right-20 top-1/3 w-64 rotate-[160deg]" />
      <div className="mx-auto max-w-5xl px-6">
        <SectionHead
          eyebrow="Products"
          title="Purpose-built for continuous newborn care."
          body="Four connected products support the caregiver, care team and every stage of the post-discharge journey."
        />
        <div>
          {products.map((p, i) => (
            <div key={p.name}>
              <div className={`flex flex-col gap-12 py-16 md:items-center md:gap-20 ${i % 2 ? "md:flex-row-reverse" : "md:flex-row"}`}>
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
                    <img src={i % 2 ? flowerB : flowerA} alt="" className="absolute -right-10 -top-10 w-48 opacity-70" loading="lazy" />
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
    <section id="impact" className="relative py-32 md:py-40">
      <div className="mx-auto max-w-7xl px-6">
        <SectionHead
          eyebrow="Impact"
          title="Making continuity of care measurable."
          body="Nayuva is designed to strengthen the connection between families and care teams after discharge."
        />
        <div className="grid auto-rows-[280px] grid-cols-1 gap-4 md:grid-cols-3">
          <div className="group relative flex flex-col justify-end overflow-hidden rounded-3xl bg-rose-gradient p-10 text-primary-foreground md:col-span-2 md:row-span-2">
            <img src={baby.url} alt="" className="absolute -right-10 top-0 h-full opacity-25 transition-transform duration-700 group-hover:scale-105" />
            <div className="relative z-10 space-y-4">
              <span className="inline-flex items-center gap-2 rounded-full bg-background/20 px-4 py-1.5 text-sm font-medium backdrop-blur-sm">
                <span className="size-2 animate-pulse rounded-full bg-primary-foreground" /> Continuity
              </span>
              <h3 className="text-5xl font-bold tracking-tight">
                Care that continues
                <br />
                after discharge.
              </h3>
              <p className="max-w-md text-lg opacity-90">
                More consistent care between discharge and follow-up.
              </p>
            </div>
          </div>
          <div className="glass relative flex flex-col justify-between overflow-hidden rounded-3xl p-8">
            <div className="flex size-14 items-center justify-center rounded-2xl bg-primary text-primary-foreground">
              <Eye className="size-6" />
            </div>
            <div>
              <p className="eyebrow mb-2">Visibility</p>
              <p className="text-lg font-semibold leading-snug">Better visibility into what happens between clinical visits.</p>
            </div>
          </div>
          <div className="glass flex flex-col justify-between rounded-3xl p-8">
            <div className="flex size-12 items-center justify-center rounded-xl bg-blush text-primary">
              <CalendarCheck className="size-6" />
            </div>
            <div>
              <p className="eyebrow mb-2">Follow-up</p>
              <p className="text-lg font-semibold leading-snug">More connected coordination of appointments and next steps.</p>
            </div>
          </div>
          <div className="relative flex flex-col justify-center gap-3 overflow-hidden rounded-3xl bg-foreground p-8 text-background">
            <span className="absolute right-5 top-5 flex size-3">
              <span className="absolute inline-flex size-full animate-ping rounded-full bg-primary opacity-75" />
              <span className="relative inline-flex size-3 rounded-full bg-primary" />
            </span>
            <p className="eyebrow">Efficiency</p>
            <p className="text-2xl font-bold leading-snug">Less manual effort in communication and clinical documentation.</p>
          </div>
          <a href="#cta" className="group relative flex flex-col justify-between overflow-hidden rounded-3xl bg-blush p-8 md:col-span-2">
            <img src={flowerA} alt="" className="absolute -bottom-16 -right-10 w-64 opacity-80" loading="lazy" />
            <div className="flex items-start justify-between">
              <span className="rounded-full bg-background/60 px-3 py-1.5 text-xs font-bold uppercase tracking-wider text-primary">
                Outcome
              </span>
            </div>
            <p className="relative max-w-lg text-2xl font-bold leading-snug text-primary-deep">
              Better-connected care can help families stay supported and care teams stay informed.
            </p>
            <ArrowUpRight className="absolute right-8 top-8 size-6 text-primary transition group-hover:rotate-45" />
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
    <section id="team" className="relative py-32 md:py-40">
      <Flower src={flowerB} className="-left-12 bottom-10 w-52 rotate-45" />
      <div className="mx-auto max-w-6xl px-6">
        <div className="mb-20 flex flex-col gap-6 md:flex-row md:items-end md:justify-between">
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
                <img src={i % 2 ? flowerA : flowerB} alt="" className="absolute inset-0 size-full scale-125 object-cover opacity-40" loading="lazy" />
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
    <section id="cta" className="relative py-32 md:py-40">
      <div className="relative mx-auto max-w-5xl overflow-hidden rounded-[2.5rem] glass px-8 py-24 text-center">
        <Flower src={flowerA} className="-left-16 -top-16 w-60 rotate-[30deg]" />
        <Flower src={flowerA} className="-bottom-20 -right-16 w-64 rotate-[210deg]" />
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
    <main className="overflow-x-hidden">
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
