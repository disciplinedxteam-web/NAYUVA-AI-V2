// Browser-safe animated SVG mascots for Milan, Lekha and Sutra. Props only appear in task states.
export type MascotName = 'milan' | 'lekha' | 'sutra';
export type MascotState = 'idle' | 'working' | 'listening' | 'done';

const labels: Record<MascotName, Record<MascotState, string>> = {
  milan: { idle: 'Milan looking around', working: 'Milan writing an appointment', listening: 'Milan listening', done: 'Milan finished' },
  lekha: { idle: 'Lekha looking around', working: 'Lekha listening', listening: 'Lekha listening closely', done: 'Lekha holding a finished clinical note' },
  sutra: { idle: 'Sutra looking around', working: 'Sutra examining the care journey with a magnifying glass', listening: 'Sutra listening', done: 'Sutra finished' },
};

export function Mascot({ name, state = 'idle', size = 168, className = '' }: { name: MascotName; state?: MascotState; size?: number; className?: string }) {
  const id = `m-${name}-${state}`;
  const s = name === 'lekha' && state === 'working' ? 'listening' : state;
  const pose = name === 'milan' && s === 'working' ? 'write' : name === 'lekha' && s === 'listening' ? 'listen' : name === 'lekha' && s === 'done' ? 'present' : name === 'sutra' && s === 'working' ? 'inspect' : 'idle';
  const tone = `var(--mascot-${name})`;
  const arm = { stroke: `url(#${id}-arm)`, strokeWidth: 15, strokeLinecap: 'round' as const, fill: 'none' };
  const hand = { fill: `url(#${id}-body)` };
  return (
    <svg className={`mascot mascot-${name} mascot-pose-${pose} ${className}`} width={size} height={size} viewBox="0 0 200 200" role="img" aria-label={labels[name][s]}>
      <defs>
        <radialGradient id={`${id}-body`} cx="36%" cy="30%" r="75%">
          <stop offset="0%" style={{ stopColor: `color-mix(in oklab, ${tone} 45%, white)` }} />
          <stop offset="55%" style={{ stopColor: tone }} />
          <stop offset="100%" style={{ stopColor: `color-mix(in oklab, ${tone} 70%, black)` }} />
        </radialGradient>
        <linearGradient id={`${id}-arm`} x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" style={{ stopColor: `color-mix(in oklab, ${tone} 75%, white)` }} />
          <stop offset="100%" style={{ stopColor: `color-mix(in oklab, ${tone} 85%, black)` }} />
        </linearGradient>
      </defs>
      <ellipse className="mascot-shadow" cx="100" cy="186" rx="46" ry="7" />
      <g className="mascot-float">
        <g className="mascot-head">
          <circle cx="100" cy="94" r="62" fill={`url(#${id}-body)`} />
          <ellipse cx="78" cy="62" rx="20" ry="11" className="mascot-gloss" />
          <g className="mascot-eyes">
            <rect className="mascot-eye" x="80" y="78" width="9" height="19" rx="4.5" />
            <rect className="mascot-eye" x="111" y="78" width="9" height="19" rx="4.5" />
          </g>
          <path className="mascot-mouth" d="M85 108 Q100 121 115 108" />
          <path className="mascot-gear-line" d="M42 96 Q40 26 100 26 Q160 26 158 96" />
          <rect className="mascot-gear" x="32" y="80" width="20" height="34" rx="9" />
          <rect className="mascot-gear" x="148" y="80" width="20" height="34" rx="9" />
          <path className="mascot-gear-line thin" d="M160 112 Q160 130 134 130" />
          <circle className="mascot-gear" cx="132" cy="130" r="5" />
        </g>
        {pose === 'idle' && <>
          <path {...arm} d="M50 132 Q34 152 44 170" /><circle {...hand} cx="45" cy="172" r="12" />
          <g className="mascot-wave"><path {...arm} d="M150 132 Q166 152 156 170" /><circle {...hand} cx="155" cy="172" r="12" /></g>
        </>}
        {pose === 'write' && <>
          <g className="mascot-prop-in">
            <g transform="rotate(-8 124 152)">
              <rect x="102" y="124" width="44" height="54" rx="5" className="mascot-paper" />
              {[110, 120, 130, 140].map(x => <circle key={x} cx={x} cy="124" r="2.6" className="mascot-ring" />)}
              <path className="mascot-ink mascot-scribble" d="M110 140 h26 M110 150 h20 M110 160 h24" />
              <path className="mascot-heart" d="M124 170 l-5 -5 a3.2 3.2 0 0 1 5 -4 a3.2 3.2 0 0 1 5 4 z" />
            </g>
          </g>
          <path {...arm} d="M150 130 Q160 158 132 166" /><circle {...hand} cx="130" cy="166" r="12" />
          <g className="mascot-writing">
            <path {...arm} d="M50 130 Q44 156 72 150" />
            <line x1="70" y1="146" x2="96" y2="120" className="mascot-pen" />
            <circle {...hand} cx="74" cy="148" r="12" />
          </g>
        </>}
        {pose === 'listen' && <>
          <g className="mascot-sound"><path d="M18 78 q-8 16 0 32" /><path d="M8 70 q-12 24 0 48" /></g>
          <path {...arm} d="M52 128 Q28 118 36 98" /><circle {...hand} cx="38" cy="96" r="12" />
          <path {...arm} d="M150 132 Q166 152 156 170" /><circle {...hand} cx="155" cy="172" r="12" />
        </>}
        {pose === 'present' && <>
          <path {...arm} d="M50 132 Q34 152 44 170" /><circle {...hand} cx="45" cy="172" r="12" />
          <g className="mascot-prop-in">
            <g transform="rotate(8 172 64)">
              <rect x="148" y="28" width="48" height="62" rx="6" className="mascot-paper" />
              {[42, 56, 70].map(y => <g key={y}><circle cx="157" cy={y} r="3.5" className="mascot-check" /><path className="mascot-ink" d={`M164 ${y} h24`} /></g>)}
            </g>
          </g>
          <path {...arm} d="M150 128 Q172 118 166 94" /><circle {...hand} cx="164" cy="92" r="12" />
        </>}
        {pose === 'inspect' && <>
          <g className="mascot-prop-in">
            <rect x="128" y="118" width="40" height="54" rx="6" transform="rotate(10 148 145)" className="mascot-paper" />
          </g>
          <path {...arm} d="M150 130 Q164 156 146 162" /><circle {...hand} cx="146" cy="160" r="12" />
          <g className="mascot-scan">
            <path {...arm} d="M50 132 Q46 116 66 112" />
            <line x1="70" y1="110" x2="80" y2="96" className="mascot-handle" />
            <circle cx="88" cy="82" r="20" className="mascot-lens" />
            <circle {...hand} cx="68" cy="112" r="12" />
          </g>
        </>}
      </g>
    </svg>
  );
}

export function SpeechHeader({ name, state, title, text }: { name: MascotName; state?: MascotState; title: string; text: string }) {
  return (
    <div className="speech-header">
      <Mascot name={name} state={state} size={150} />
      <div className="speech-cloud" role="note"><strong>{title}</strong><p>{text}</p></div>
    </div>
  );
}
