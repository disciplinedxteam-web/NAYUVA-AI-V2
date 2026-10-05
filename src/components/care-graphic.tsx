type GraphicKind = "home" | "updates" | "visibility" | "followup" | "record" | "continuity" | "efficiency" | "support" | "impact-visibility" | "impact-followup";

export function CareGraphic({ kind, large = false }: { kind: GraphicKind; large?: boolean }) {
  if (["continuity", "impact-visibility", "impact-followup", "efficiency", "support"].includes(kind)) return <div className={`care-graphic impact-art art-${kind} ${large ? "impact-art-large" : ""}`} aria-hidden="true">
    <svg viewBox="0 0 360 170" fill="none">
      {kind === "continuity" && <>
        <path d="M57 90C97 19 142 25 181 86S265 151 303 83C265 17 220 27 181 86S98 152 57 90Z" className="continuity-route" />
        <path d="M57 90C97 19 142 25 181 86S265 151 303 83C265 17 220 27 181 86S98 152 57 90Z" className="continuity-flow" />
        <g className="continuity-marker"><circle cx="57" cy="90" r="22" /><path d="M46 102V78h22v24M50 78v-5h14v5M52 88h10M57 83v10" /></g>
        <g className="continuity-marker"><circle cx="303" cy="83" r="22" /><path d="M289 81l14-11 14 11M293 78v18h20V78M300 96V85h6v11" /></g>
        <g className="continuity-heart"><circle cx="181" cy="86" r="28" /><path d="M181 99l-13-12c-10-11 4-22 13-12 9-10 23 1 13 12z" /></g>
      </>}
      {kind === "impact-visibility" && <>
        <circle cx="180" cy="85" r="64" className="radar-ring" /><circle cx="180" cy="85" r="41" className="radar-ring" /><path d="M103 85h154M180 8v154" className="radar-grid" />
        <g className="radar-sweep"><path d="M180 85V21A64 64 0 0 1 244 85Z" /><path d="M180 85V21" /></g>
        {[[145,55],[215,104],[159,125]].map(([x,y],i) => <g key={x} className={`radar-point point-${i}`}><circle cx={x} cy={y} r="10" /><circle cx={x} cy={y} r="3" /></g>)}
        <circle cx="180" cy="85" r="14" className="radar-center" /><path d="M174 85h12M180 79v12" className="radar-cross" />
      </>}
      {kind === "impact-followup" && <>
        <g className="impact-calendar"><rect x="121" y="30" width="118" height="113" rx="10" /><path d="M121 57h118M149 22v17M211 22v17" />
          {[0,1,2].flatMap(row => [0,1,2,3].map(col => <rect key={`${row}-${col}`} x={137+col*24} y={73+row*20} width="10" height="7" rx="2" className="calendar-day" />))}
        </g>
        <g className="appointment-highlight"><rect x="155" y="86" width="22" height="22" rx="5" /><path d="M161 96l4 4 7-9" /></g>
        <g className="reminder-bell"><circle cx="254" cy="56" r="24" /><path d="M245 63h18l-3-5v-8a6 6 0 0 0-12 0v8zM251 68h6" /></g>
        <path d="M86 99l10 10 17-22" className="appointment-check" />
      </>}
      {kind === "efficiency" && <>
        <g className="efficiency-input"><path d="M50 54h75v56H74l-18 12V110h-6z" /><path d="M63 79v7M74 72v21M85 65v34M96 74v16M107 79v7" className="efficiency-wave" /></g>
        <path d="M145 85h57M194 77l8 8-8 8" className="efficiency-stream" />
        <g className="efficiency-note"><rect x="225" y="33" width="81" height="109" rx="7" /><path d="M240 53h34" />
          {[0,1,2].map(i => <g key={i} className={`note-line note-line-${i}`}><path d={`M240 ${75+i*21}l4 4 7-8M260 ${75+i*21}h30`} /></g>)}
        </g>
      </>}
      {kind === "support" && <>
        <path d="M95 90Q180 20 265 90M95 90Q180 160 265 90" className="support-link" />
        <g className="support-person family-person"><circle cx="95" cy="90" r="31" /><circle cx="95" cy="80" r="8" /><path d="M80 107q0-20 15-20t15 20" /></g>
        <g className="support-person team-person"><circle cx="265" cy="90" r="31" /><circle cx="265" cy="80" r="8" /><path d="M250 107q0-20 15-20t15 20M258 99h14M265 92v14" /></g>
        <g className="support-heart"><path d="M180 106l-16-15c-12-13 4-28 16-15 12-13 28 2 16 15z" /></g>
        <circle cx="143" cy="61" r="4" className="support-message message-one" /><circle cx="217" cy="118" r="4" className="support-message message-two" />
      </>}
    </svg>
  </div>;

  if (kind === "home") return <div className="care-graphic home-art" aria-hidden="true">
    <div className="home-plan-header"><span>Today's care plan</span><span className="graphic-status">At home</span></div>
    <div className="home-plan-body">
      <div className="home-heart"><svg viewBox="0 0 64 64" fill="none"><path d="M32 48L14 31C1 14 23 4 32 19 41 4 63 14 50 31z" /><path d="M18 31h8l4-8 5 17 4-9h7" /></svg></div>
      <div className="home-tasks">{["Feeding", "Sleep", "Daily care"].map((text,i) => <div key={text} className={`home-task task-${i}`}><span>{text}</span><span className="home-progress"><span /></span><svg viewBox="0 0 18 18"><path d="M4 9l3 3 7-7" /></svg></div>)}</div>
    </div>
  </div>;

  if (kind === "updates") return <div className="care-graphic updates-art" aria-hidden="true">
    <div className="update-conversation"><span className="update-avatar"><svg viewBox="0 0 20 20"><path d="M4 7v6M8 4v12M12 6v8M16 8v4" /></svg></span><span>Caregiver update<span className="typing-dots"><i /><i /><i /></span></span></div>
    <div className="update-connector"><span /><span /><span /></div>
    <div className="update-summary"><span className="summary-title">Structured update</span>{["Feeding", "Sleep & comfort"].map((s,i) => <div key={s} className={`summary-field field-${i}`}><span>{s}</span><span className="summary-line" /><svg viewBox="0 0 16 16"><path d="M3 8l3 3 7-7" /></svg></div>)}</div>
  </div>;
  const steps = kind === "followup" ? ["Day 3 · Weight check", "Day 7 · Feeding review", "Week 2 · Paediatric visit"]
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
        <span className="graphic-check"><svg viewBox="0 0 20 20" fill="none"><path d={kind === "followup" ? "M4 5h12v12H4zM4 8h12M7 3v4M13 3v4M7 12l2 2 4-4" : "M5 10l3 3 7-7"} /></svg></span>
        <span>{step}</span>
        <span className="graphic-row-tail" />
      </div>)}
    </div>
  );
}