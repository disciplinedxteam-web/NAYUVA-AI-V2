import { Activity, CalendarClock, Check, CheckCheck } from "lucide-react";

/** Looping chat previews shared by the homepage Platform section and the judge guides. */
export type DemoVariant = "home" | "care-team" | "caregiver";

export function ConverseDemo({ variant = "home" }: { variant?: DemoVariant }) {
  if (variant === "care-team") return (
    <div className="pillar-demo" aria-hidden="true">
      <div className="pd-head"><span className="pd-avatar">P</span><span><strong>Priya · Baby Aarav</strong><small><i className="pd-live" />online</small></span></div>
      <div className="pd-msg pd-in" style={{ animationDelay: "0.2s" }}>He fed well and slept for 3 hours.</div>
      <div className="pd-msg pd-out" style={{ animationDelay: "1.2s" }}>That's good to hear, thank you! <CheckCheck className="pd-tick" /></div>
      <div className="pd-msg pd-in pd-card" style={{ animationDelay: "2.2s" }}><Activity className="size-4" /> Svara check-in · <span className="pd-chip"><Check className="size-3" />Approve</span></div>
    </div>
  );
  if (variant === "caregiver") return (
    <div className="pillar-demo" aria-hidden="true">
      <div className="pd-head"><span className="pd-avatar">CT</span><span><strong>Care Team</strong><small><i className="pd-live" />online</small></span></div>
      <div className="pd-msg pd-out" style={{ animationDelay: "0.2s" }}>Is this rash normal? Photo attached. <CheckCheck className="pd-tick" /></div>
      <div className="pd-msg pd-in" style={{ animationDelay: "1.2s" }}>Thanks for the photo. Let's take a look on Thursday.</div>
      <div className="pd-msg pd-in pd-card" style={{ animationDelay: "2.2s" }}><CalendarClock className="size-4" /> Visit · Thu 10:30 · In person</div>
    </div>
  );
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

export function SutraDemo({ variant = "home" }: { variant?: DemoVariant }) {
  const question = variant === "care-team" ? "What happened in the last check-in?" : variant === "caregiver" ? "When is my baby's next visit?" : "बच्ची का वज़न पिछले हफ़्ते कैसा था?";
  const card = variant === "caregiver" ? "Next visit · Thu 10:30" : variant === "care-team" ? "Book a visit · Thu 10:30" : "Proposed visit · Approve";
  return (
    <div className="pillar-demo" aria-hidden="true">
      <div className="pd-msg pd-out" style={{ animationDelay: "0.2s" }}>{question}</div>
      <div className="pd-msg pd-in pd-answer" style={{ animationDelay: "1.3s" }}>
        <span className="pd-lines"><i /><i /><i style={{ width: "62%" }} /></span>
        <span className="pd-sources"><b>Day 7 check-in</b><b>Visit summary</b></span>
      </div>
      <div className="pd-msg pd-in pd-card" style={{ animationDelay: "2.4s" }}><CalendarClock className="size-4" /> {card}</div>
    </div>
  );
}
