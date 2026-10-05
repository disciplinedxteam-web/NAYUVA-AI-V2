type GraphicKind = "home" | "updates" | "visibility" | "followup" | "record" | "continuity" | "efficiency" | "support";

export function CareGraphic({ kind, large = false }: { kind: GraphicKind; large?: boolean }) {
  const steps = kind === "home" ? ["Care plan", "Home care", "Team connected"]
    : kind === "updates" ? ["Caregiver update", "Structured summary", "Ready for review"]
    : kind === "followup" ? ["Day 3 · Weight check", "Day 7 · Feeding review", "Week 2 · Paediatric visit"]
    : kind === "record" ? ["Care plan", "Home update", "Clinical note"]
    : kind === "efficiency" ? ["Conversation", "Structured note", "Clinician review"]
    : kind === "support" ? ["Family", "Connected care", "Care team"]
    : ["Discharge", "Home updates", "Follow-up"];

  if (kind === "visibility") return (
    <div className="care-graphic" aria-hidden="true">
      <div className="graphic-topline"><span>Care journey</span><span className="graphic-status">Connected</span></div>
      <svg viewBox="0 0 320 112" fill="none" className="care-chart">
        {[28, 58, 88].map(y => <path key={y} d={`M0 ${y} H320`} className="chart-grid" />)}
        <path d="M0 98 C30 98 45 60 75 67 S130 96 158 50 S215 65 243 35 S285 42 320 12" className="chart-line" />
        {[[75,67],[158,50],[243,35]].map(([x,y],i) => <g key={x} className={`graphic-step step-${i}`}><circle cx={x} cy={y} r="10" className="chart-halo" /><circle cx={x} cy={y} r="4" className="chart-dot" /></g>)}
      </svg>
    </div>
  );

  if (kind === "continuity" || kind === "support") return (
    <div className={`care-graphic journey-graphic ${large ? "journey-large" : ""}`} aria-hidden="true">
      <div className="journey-track" />
      {steps.map((step,i) => <div key={step} className={`journey-stop graphic-step step-${i}`}>
        <div className="journey-symbol"><svg viewBox="0 0 32 32" fill="none"><path d={i===0 ? "M5 27V9h22v18M11 9V5h10v4M12 17h8M16 13v8" : i===1 ? "M5 14L16 5l11 9M8 12v15h16V12M13 27v-9h6v9" : "M7 7h18v20H7zM11 4v6M21 4v6M11 17l4 4 7-8"} /></svg></div>
        <span>{step}</span>
      </div>)}
    </div>
  );

  return (
    <div className={`care-graphic graphic-list graphic-${kind}`} aria-hidden="true">
      {steps.map((step,i) => <div key={step} className={`graphic-row graphic-step step-${i}`}>
        <span className="graphic-check"><svg viewBox="0 0 20 20" fill="none"><path d={kind === "updates" && i===0 ? "M4 4h12v9H9l-5 3V4z" : "M5 10l3 3 7-7"} /></svg></span>
        <span>{step}</span>
        <span className="graphic-row-tail" />
      </div>)}
    </div>
  );
}