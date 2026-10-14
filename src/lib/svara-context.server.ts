/** Builds personalised Svara agent variables from one baby's Care Plan, question bank and history. Server-only. */
type Db = { from: (t: string) => any }; // eslint-disable-line @typescript-eslint/no-explicit-any
type Q = { id: string; topic: string; first_wording: string; returning_wording: string | null };

export async function buildSvaraVariables(db: Db, babyId: string, checkinId: string, plan: Record<string, unknown>) {
  const topics = (Array.isArray(plan['categories']) ? plan['categories'] : []).map(String).filter((t) => t !== 'Caregiver concerns');
  const [{ data: qs }, { data: cards }, { data: answers }, { data: instr }] = await Promise.all([
    db.from('question_bank').select('id,topic,first_wording,returning_wording').eq('active', true).eq('approval_status', 'approved').in('topic', [...topics, 'Caregiver concerns']),
    db.from('health_cards').select('created_at,category,quote,summary_text').eq('baby_id', babyId).order('created_at', { ascending: false }).limit(3),
    db.from('caregiver_responses').select('topic,original_text,created_at').eq('baby_id', babyId).neq('session_id', checkinId).order('created_at', { ascending: false }).limit(20),
    db.from('followup_instructions').select('instruction,expires_on').eq('baby_id', babyId).eq('status', 'active'),
  ]);
  const returning = (cards?.length ?? 0) > 0;
  const bank = (qs ?? []) as Q[];
  const last = new Map<string, string>();
  for (const a of (answers ?? []) as { topic: string; original_text: string | null }[]) if (a.original_text && !last.has(a.topic)) last.set(a.topic, a.original_text.slice(0, 160));
  const ordered = topics.map((t) => {
    const q = bank.find((x) => x.topic === t);
    const text = q ? (returning && q.returning_wording) || q.first_wording : `How has your baby been with ${t.toLowerCase()} since the last check-in?`;
    return { topic: t, text, previous: last.get(t) };
  });
  const final = bank.find((x) => x.topic === 'Caregiver concerns')?.first_wording ?? 'Before we finish, is there anything else worrying you that the care team should know?';
  const lines = ordered.map((q, i) => `${i + 1}. [${q.topic}] ${q.text}${q.previous ? ` (Last time the caregiver said: "${q.previous}")` : ''}`);
  lines.push(`${ordered.length + 1}. [Caregiver concerns] ${final} (ALWAYS ask last)`);
  const today = new Date().toISOString().slice(0, 10);
  const prevCards = ((cards ?? []) as { created_at: string; category: string; quote: string }[]).map((c) => `${c.created_at.slice(0, 10)} — ${c.category}: "${c.quote}"`.slice(0, 300));
  return {
    session_type: returning ? 'returning' : 'first',
    care_topics: topics.join(', '),
    questions_to_ask: lines.join('\n').slice(0, 3800),
    previous_updates: prevCards.join('\n').slice(0, 1200) || 'None yet — this is the first check-in.',
    clinician_instructions: ((instr ?? []) as { instruction: string; expires_on: string | null }[]).filter((i) => !i.expires_on || i.expires_on >= today).map((i) => i.instruction).join('\n').slice(0, 800) || 'None',
    question_count: String(lines.length),
  };
}
