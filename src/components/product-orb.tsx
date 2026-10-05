export type ProductState = "working" | "searching" | "lighthouse" | "reasoning";

/** Self-contained, browser-safe character animations, not a third-party orb dependency. */
export function ProductOrb({ state, name }: { state: ProductState; name: string }) {
  return <div className={`product-animation product-${state}`} role="img" aria-label={`${name}: ${state === "working" ? "a listening voice assistant" : state === "searching" ? "searching for a connected follow-up" : state === "lighthouse" ? "a lighthouse finding clinical information" : "connecting a care journey"}`}>
    <svg viewBox="0 0 400 300" fill="none" aria-hidden="true">
      <ellipse cx="200" cy="258" rx="67" ry="7" className="orb-shadow" />
      {state === "working" && <>
        <g className="voice-waves">{[0,1,2,3,4,5,6].map(i => <rect key={i} x={52+i*49} y="133" width="5" height="36" rx="2.5" className={`voice-bar voice-bar-${i}`} />)}</g>
        <circle cx="200" cy="151" r="92" className="orb-ripple ripple-one" />
        <circle cx="200" cy="151" r="92" className="orb-ripple ripple-two" />
        <g className="orb-float"><circle cx="200" cy="151" r="67" className="orb-body" /><ellipse cx="179" cy="125" rx="29" ry="19" className="orb-shine" />
          <g className="orb-eyes"><path d="M179 143v10M221 143v10" /></g><path d="M184 172q16 13 32 0" className="orb-face" />
          <path d="M143 145q-8-47 57-47t57 47" className="headset" /><rect x="132" y="141" width="17" height="30" rx="8" className="orb-accessory" /><rect x="251" y="141" width="17" height="30" rx="8" className="orb-accessory" /><path d="M258 168q0 21-24 21" className="headset" /><rect x="224" y="185" width="15" height="7" rx="3.5" className="orb-accessory" />
        </g>
      </>}
      {state === "searching" && <>
        <g className="search-targets">{([[80,88],[305,80],[319,210]] as const).map(([x,y],i) => <g key={x} className={`search-target target-${i}`}><rect x={x-18} y={y-19} width="36" height="38" rx="7" /><path d={`M${x-8} ${y-6}h16M${x-8} ${y+2}h10M${x-8} ${y+10}h13`} /></g>)}</g>
        <g className="orb-search"><circle cx="195" cy="158" r="65" className="orb-body" /><ellipse cx="173" cy="130" rx="27" ry="18" className="orb-shine" /><g className="orb-eyes"><path d="M171 151v9M208 151v9" /></g><path d="M177 177q12 9 24 0" className="orb-face" />
          <g className="search-glass"><circle cx="248" cy="170" r="25" className="lens" /><path d="M265 189l25 26" className="lens-handle" /><path d="M236 162q3-8 12-8" className="lens-glint" /></g>
        </g>
        <path d="M70 243h260" className="orb-ground" />
      </>}
      {state === "lighthouse" && <>
        <g className="lighthouse-pages"><path d="M63 119h39v48H63zM69 130h26M69 139h19M69 148h23" /><path d="M300 97h35v45h-35zM307 108h20M307 117h15M307 126h18" /></g>
        <g className="lighthouse-beam"><path d="M200 92L350 27v130z" /></g>
        <path d="M164 231l15-132h42l15 132z" className="orb-body" /><path d="M175 141h50M170 181h60" className="lighthouse-stripe" />
        <path d="M168 97h64V64h-64z" className="orb-accessory" /><path d="M160 64l40-23 40 23z" className="orb-body" /><path d="M161 100h78M151 233h98" className="lighthouse-base" />
        <path d="M184 77v9M216 77v9" className="orb-eyes" /><path d="M194 88q6 4 12 0" className="orb-face" />
        <path d="M94 247q26-9 53 0t53 0t53 0t53 0" className="lighthouse-water water-one" /><path d="M94 257q26-9 53 0t53 0t53 0t53 0" className="lighthouse-water water-two" />
        <g className="found-note"><circle cx="310" cy="198" r="23" /><path d="M300 198l7 7 13-15" /></g>
      </>}
      {state === "reasoning" && <>
        <ellipse cx="200" cy="155" rx="124" ry="67" className="reasoning-orbit" />
        <ellipse cx="200" cy="155" rx="91" ry="105" transform="rotate(35 200 155)" className="reasoning-orbit" />
        <g className="reasoning-nodes"><circle cx="79" cy="142" r="10" /><circle cx="282" cy="76" r="8" /><circle cx="289" cy="219" r="11" /></g>
        <g className="orb-float"><circle cx="200" cy="155" r="61" className="orb-body" /><ellipse cx="180" cy="130" rx="27" ry="16" className="orb-shine" /><path d="M177 151q5-6 10 0M214 151q5-6 10 0" className="orb-face" /><path d="M190 176q10 6 20 0" className="orb-face" /></g>
        <g className="thought-dots"><circle cx="186" cy="58" r="4" /><circle cx="201" cy="51" r="5" /><circle cx="217" cy="58" r="4" /></g>
      </>}
    </svg>
  </div>;
}