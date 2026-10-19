import { DAY_PROTOCOL, NEONATAL_CONDITIONS } from './day-protocol-data';
export { DAY_PROTOCOL, NEONATAL_CONDITIONS };
export type ProtocolQuestion = { topic: string; text: string; source: 'protocol' | 'condition' | 'final' };

export const FINAL_QUESTION = "Before we finish, is there anything about your baby that has been worrying you or that you'd like the care team to know?";

/** Non-diagnostic caregiver observation prompts added for clinician-documented conditions. They ask what the caregiver
 * noticed, never interpret it. Grouped by observation area so every listed condition maps to one prompt. */
const OVERLAY: { match: RegExp; topic: string; text: string }[] = [
  { match: /jaundice|hyperbilirubin|cholestasis/i, topic: 'Skin and eye colour', text: 'Have you noticed any change in the yellow colour of the skin or eyes, or in the colour of stools or urine, since the last check-in?' },
  { match: /sepsis|pneumonia|meningitis|herpes|syphilis|tetanus|rsv|urinary|infection/i, topic: 'Temperature and activity', text: 'Have you noticed any fever, unusual coldness, or a change in how active or alert your baby is?' },
  { match: /respiratory|apnea|pneumonia|dysplasia|heart|rsv/i, topic: 'Breathing', text: 'Have you noticed any change in how your baby breathes, any pauses, or any blue or grey colour around the lips?' },
  { match: /hypoglycemia|dehydration|hypocalcemia|enterocolitis|polycythemia/i, topic: 'Feeding and wet diapers', text: 'How have feeds and wet diapers been today compared with yesterday?' },
  { match: /hypothermia/i, topic: 'Warmth', text: 'Does your baby feel warm as usual when held, or have you noticed the hands, feet or body feeling cold?' },
  { match: /seizure|encephalopathy|hemorrhage|meningitis|tetanus|hypocalcemia/i, topic: 'Movements and responsiveness', text: 'Have you noticed any unusual movements, stiffness, jerking, or a change in how your baby responds to you?' },
  { match: /anemia|polycythemia|heart/i, topic: 'Colour and feeding effort', text: 'Have you noticed your baby looking paler than usual, or tiring easily during feeds?' },
  { match: /omphalitis|umbilical/i, topic: 'Umbilical cord', text: 'How does the cord area look today — any redness, swelling, discharge or smell?' },
  { match: /conjunctivitis|retinopathy/i, topic: 'Eyes', text: 'Have you noticed any discharge, redness, or swelling around your baby’s eyes, and is the eye follow-up arranged as advised?' },
  { match: /candidiasis|thrush/i, topic: 'Mouth and feeding comfort', text: 'Have you noticed white patches in the mouth, or any discomfort while feeding?' },
  { match: /enterocolitis/i, topic: 'Tummy and stools', text: 'Have you noticed a swollen tummy, green vomit, or blood in the stool?' },
  { match: /hypothyroidism/i, topic: 'Medication and alertness', text: 'Have you been able to give the prescribed medicine as advised, and how alert has your baby been?' },
];
export function conditionQuestions(conditions: readonly string[]): ProtocolQuestion[] {
  const seen = new Set<string>(); const out: ProtocolQuestion[] = [];
  for (const c of conditions) for (const o of OVERLAY) if (o.match.test(c) && !seen.has(o.topic)) { seen.add(o.topic); out.push({ topic: o.topic, text: o.text, source: 'condition' }); }
  return out;
}

/** Day of life in India time: the date of birth is Day 1. Clamped to the 42-day framework. */
export function babyDay(dob: string, now = Date.now()) {
  const ist = (ms: number) => Math.floor((ms + 5.5 * 3600000) / 86400000);
  const born = new Date(`${dob}T00:00:00+05:30`).getTime();
  if (Number.isNaN(born)) return 1;
  return Math.min(42, Math.max(1, ist(now) - ist(born) + 1));
}

export function todaysCheckin(plan: { dob?: string; babyName?: string; neonatalConditions?: readonly string[] }, now = Date.now()) {
  const day = babyDay(plan.dob ?? '', now);
  const entry = DAY_PROTOCOL[day - 1] ?? DAY_PROTOCOL[0];
  const questions: ProtocolQuestion[] = [
    ...entry.questions.map((q) => ({ topic: q.topic, text: q.text, source: 'protocol' as const })),
    ...conditionQuestions(plan.neonatalConditions ?? []),
    { topic: 'Caregiver concerns', text: FINAL_QUESTION, source: 'final' },
  ];
  const topics = questions.filter((q) => q.source !== 'final').map((q) => q.topic.toLowerCase());
  const list = topics.length > 1 ? `${topics.slice(0, -1).join(', ')} and ${topics.at(-1)}` : topics[0] ?? '';
  const opening = `Today is day ${day} for ${plan.babyName || 'your baby'}, and today's topics are ${list}. Let's start.`;
  return { day, theme: entry.theme, questions, opening };
}

/** Compact brief for the voice agent: the day, the opening line and the only questions to ask, in order. */
export function svaraBrief(plan: Parameters<typeof todaysCheckin>[0], now = Date.now()) {
  const t = todaysCheckin(plan, now);
  return [
    `DAY ${t.day} CHECK-IN (${t.theme}). Open with exactly: "${t.opening}"`,
    'Ask ONLY these questions, one at a time, in this order. Rephrase gently if needed but never diagnose, reassure that the baby is medically fine, or give treatment advice. If an urgent danger sign is reported, ask the caregiver to seek immediate medical help.',
    ...t.questions.map((q, i) => `${i + 1}. [${q.topic}] ${q.text}`),
  ].join('\n');
}
