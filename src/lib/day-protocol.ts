import { DAY_PROTOCOL, NEONATAL_CONDITIONS } from './day-protocol-data';
export { DAY_PROTOCOL, NEONATAL_CONDITIONS };
export type ProtocolQuestion = { topic: string; text: string; source: 'protocol' | 'condition' | 'followup' | 'final' };

export const FINAL_QUESTION = "Before we finish, is there anything about your baby that has been worrying you or that you'd like the care team to know?";

/** Non-diagnostic caregiver observation prompts for clinician-documented conditions. They ask only what the caregiver
 * noticed, never interpret it. Every listed Care Plan condition matches at least one observation area. */
const OVERLAY: { match: RegExp; topic: string; text: string }[] = [
  { match: /jaundice|hyperbilirubin|cholestasis/i, topic: 'Skin and eye colour', text: 'have you noticed any change in the yellow colour of the skin or eyes, or in the colour of stools or urine?' },
  { match: /sepsis|pneumonia|meningitis|herpes|hsv|syphilis|tetanus|rsv|syncytial|urinary|uti|infection/i, topic: 'Temperature and activity', text: 'have you noticed any fever, unusual coldness, or a change in how active or alert your baby is?' },
  { match: /respiratory|apnea|pneumonia|dysplasia|bpd|heart|rsv|syncytial/i, topic: 'Breathing', text: 'have you noticed any change in how your baby breathes, any pauses, or any blue or grey colour around the lips?' },
  { match: /hypoglycemia|dehydration|hypocalcemia|enterocolitis|nec|polycythemia/i, topic: 'Feeding and wet diapers', text: 'how have feeds and wet diapers been today compared with yesterday?' },
  { match: /hypothermia/i, topic: 'Warmth', text: 'does your baby feel warm as usual when held, or have the hands, feet or body felt cold?' },
  { match: /seizure|encephalopathy|hemorrhage|ivh|meningitis|tetanus|hypocalcemia/i, topic: 'Movements and responsiveness', text: 'have you noticed any unusual movements, stiffness, jerking, or a change in how your baby responds to you?' },
  { match: /anemia|polycythemia|heart/i, topic: 'Colour and feeding effort', text: 'have you noticed your baby looking paler than usual, or tiring easily during feeds?' },
  { match: /omphalitis|umbilical|cord/i, topic: 'Umbilical cord', text: 'how does the cord area look today, any redness, swelling, discharge or smell?' },
  { match: /conjunctivitis|retinopathy|rop/i, topic: 'Eyes', text: 'have you noticed any discharge, redness or swelling around the eyes, and is the eye follow-up arranged as advised?' },
  { match: /candidiasis|thrush/i, topic: 'Mouth and feeding comfort', text: 'have you noticed white patches in the mouth, or any discomfort while feeding?' },
  { match: /enterocolitis|nec/i, topic: 'Tummy and stools', text: 'have you noticed a swollen tummy, green vomit, or blood in the stool?' },
  { match: /hypothyroidism/i, topic: 'Medication and alertness', text: 'have you been able to give the prescribed medicine as advised, and how alert has your baby been?' },
];
/** Plain spoken name of a condition, e.g. "Oral Candidiasis (Thrush)" -> "oral candidiasis (thrush)". */
const spoken = (c: string) => c.trim().replace(/^neonatal\s+/i, 'neonatal ').toLowerCase();
const joinNames = (n: string[]) => (n.length > 1 ? `${n.slice(0, -1).join(', ')} and ${n.at(-1)}` : n[0] ?? '');
/** One attributed question per observation area, naming the care-team-noted conditions so it is clearly not a diagnosis. */
export function conditionQuestions(conditions: readonly string[]): ProtocolQuestion[] {
  const byTopic = new Map<string, { text: string; names: string[] }>();
  for (const c of conditions) {
    if (!c.trim()) continue;
    for (const o of OVERLAY) if (o.match.test(c)) {
      const e = byTopic.get(o.topic) ?? { text: o.text, names: [] };
      if (!e.names.includes(spoken(c))) e.names.push(spoken(c));
      byTopic.set(o.topic, e);
    }
  }
  return [...byTopic].map(([topic, e]) => ({ topic, text: `Since your care team noted ${joinNames(e.names)} in your baby's discharge care plan, I wanted to check: ${e.text}`, source: 'condition' as const }));
}

export type PreviousTopic = { title: string; finding: string; status: string };
/** Follow-ups on the last check-in: anything the caregiver reported as a concern or change is asked about first. */
export function followUpQuestions(previous: readonly PreviousTopic[], max = 2): ProtocolQuestion[] {
  return previous.filter((t) => t.status === 'Concern' && t.finding.trim()).slice(0, max).map((t) => ({
    topic: t.title,
    text: `In your last check-in, you mentioned: ${t.finding.trim().replace(/[.\s]+$/, '')}. How is that now?`,
    source: 'followup' as const,
  }));
}

/** Conversation rules shared by the website and phone channels. */
export const SVARA_STYLE = [
  'Speak like a warm, friendly companion in simple everyday words, in the language the caregiver uses (Hindi, Hinglish, English or another Indian language).',
  'Keep your own turns short: one question at a time, one or two sentences.',
  'After each answer, confirm it in one sentence that starts with "Just to confirm," followed by a short neutral restatement of what the caregiver said, ending with a question. No exclamations, filler or commentary such as "Gosh" or "Wow". When they agree or correct you, move straight to the next question.',
  'You only listen and record for the care team. Never diagnose, never say the baby is medically fine, never give treatment advice. If an urgent danger sign is reported, ask the caregiver to seek immediate medical help.',
  'For questions about a condition, keep the "Since your care team noted..." wording so the caregiver knows it comes from the doctor\'s plan.',
  'At the end say only: "Thank you. Your answers have been recorded for your care team. Take care." and end the call.',
].join(' ');

/** Day of life in India time: the date of birth is Day 1. Clamped to the 42-day framework. */
export function babyDay(dob: string, now = Date.now()) {
  const ist = (ms: number) => Math.floor((ms + 5.5 * 3600000) / 86400000);
  const born = new Date(`${dob}T00:00:00+05:30`).getTime();
  if (Number.isNaN(born)) return 1;
  return Math.min(42, Math.max(1, ist(now) - ist(born) + 1));
}

export function todaysCheckin(plan: { dob?: string; babyName?: string; neonatalConditions?: readonly string[]; conditions?: readonly string[] }, now = Date.now(), previous: readonly PreviousTopic[] = []) {
  const day = babyDay(plan.dob ?? '', now);
  const entry = DAY_PROTOCOL[day - 1] ?? DAY_PROTOCOL[0];
  const questions: ProtocolQuestion[] = [
    ...followUpQuestions(previous),
    ...entry.questions.map((q) => ({ topic: q.topic, text: q.text, source: 'protocol' as const })),
    ...conditionQuestions([...(plan.neonatalConditions ?? []), ...(Array.isArray(plan.conditions) ? plan.conditions : [])]),
    { topic: 'Caregiver concerns', text: FINAL_QUESTION, source: 'final' },
  ];
  const topics = questions.filter((q) => q.source === 'protocol' || q.source === 'condition').map((q) => q.topic.toLowerCase());
  const list = topics.length > 1 ? `${topics.slice(0, -1).join(', ')} and ${topics.at(-1)}` : topics[0] ?? '';
  const opening = `Today is day ${day} for ${plan.babyName || 'your baby'}, and today's topics are ${list}. Let's start.`;
  return { day, theme: entry.theme, questions, opening };
}

/** Compact brief for the voice agent: the day, the opening line and the only questions to ask, in order. */
export function svaraBrief(plan: Parameters<typeof todaysCheckin>[0], now = Date.now(), previous: readonly PreviousTopic[] = []) {
  const t = todaysCheckin(plan, now, previous);
  return [
    `DAY ${t.day} CHECK-IN (${t.theme}). Open with exactly: "${t.opening}"`,
    SVARA_STYLE,
    'Ask ONLY these questions, one at a time, in this order:',
    ...t.questions.map((q, i) => `${i + 1}. [${q.topic}] ${q.text}`),
  ].join('\n');
}
