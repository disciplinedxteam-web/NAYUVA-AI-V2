/** Builds personalised Svara agent variables from one baby's Care Plan (day of life + conditions) and history. Server-only. */
import { svaraBrief, todaysCheckin, type PreviousTopic } from './day-protocol';
import { parseCard } from './care-card';
type Db = { from: (t: string) => any }; // eslint-disable-line @typescript-eslint/no-explicit-any

/** Topics from the most recent Health Card, so today's check-in can follow up on what the caregiver reported. */
export async function previousTopics(db: Db, babyId: string): Promise<PreviousTopic[]> {
  const { data } = await db.from('health_cards').select('summary_text').eq('baby_id', babyId).order('created_at', { ascending: false }).limit(1);
  const card = parseCard((data?.[0] as { summary_text?: string } | undefined)?.summary_text);
  return (card?.topics ?? []).filter((t) => !/caregiver concerns/i.test(t.title) || t.status === 'Concern');
}

export async function buildSvaraVariables(db: Db, babyId: string, checkinId: string, plan: Record<string, unknown>) {
  const p = plan as { dob?: string; babyName?: string; neonatalConditions?: string[]; conditions?: string[] };
  const [{ data: cards }, { data: answers }, previous] = await Promise.all([
    db.from('health_cards').select('id').eq('baby_id', babyId).limit(1),
    db.from('caregiver_responses').select('topic,original_text').eq('baby_id', babyId).neq('session_id', checkinId).order('created_at', { ascending: false }).limit(6),
    previousTopics(db, babyId),
  ]);
  const returning = (cards?.length ?? 0) > 0;
  const today = todaysCheckin(p, Date.now(), previous);
  const history = ((answers ?? []) as { topic: string; original_text: string | null }[]).filter((a) => a.original_text).slice(0, 3).map((a) => `${a.topic}: "${a.original_text!.slice(0, 120)}"`).join('; ');
  const last = previous.filter((t) => t.status !== 'Not discussed').slice(0, 4).map((t) => `${t.title}: ${t.finding.slice(0, 100)}`).join('; ');
  const brief = svaraBrief(p, Date.now(), previous)
    + (last ? `\nLast check-in (for context, ask what changed): ${last}` : '')
    + (history ? `\nPrevious caregiver answers: ${history}` : '');
  return {
    // `session_type` is a registered variable on the published agent, so it is the one channel guaranteed to reach it.
    session_type: `${returning ? 'returning' : 'first'} check-in.\n${brief}`.slice(0, 3800),
    day_of_life: String(today.day),
    opening_line: today.opening,
    questions_to_ask: brief.slice(0, 3800),
  };
}
