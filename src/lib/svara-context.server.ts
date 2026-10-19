/** Builds personalised Svara agent variables from one baby's Care Plan (day of life + conditions) and history. Server-only. */
import { svaraBrief, todaysCheckin } from './day-protocol';
type Db = { from: (t: string) => any }; // eslint-disable-line @typescript-eslint/no-explicit-any

export async function buildSvaraVariables(db: Db, babyId: string, checkinId: string, plan: Record<string, unknown>) {
  const p = plan as { dob?: string; babyName?: string; neonatalConditions?: string[] };
  const [{ data: cards }, { data: answers }] = await Promise.all([
    db.from('health_cards').select('id').eq('baby_id', babyId).limit(1),
    db.from('caregiver_responses').select('topic,original_text').eq('baby_id', babyId).neq('session_id', checkinId).order('created_at', { ascending: false }).limit(6),
  ]);
  const returning = (cards?.length ?? 0) > 0;
  const today = todaysCheckin(p);
  const history = ((answers ?? []) as { topic: string; original_text: string | null }[]).filter((a) => a.original_text).slice(0, 3).map((a) => `${a.topic}: "${a.original_text!.slice(0, 120)}"`).join('; ');
  const brief = svaraBrief(p) + (history ? `\nPrevious caregiver answers (ask what changed, do not repeat): ${history}` : '');
  return {
    // `session_type` is a registered variable on the published agent, so it is the one channel guaranteed to reach it.
    session_type: `${returning ? 'returning' : 'first'} check-in.\n${brief}`.slice(0, 3800),
    day_of_life: String(today.day),
    opening_line: today.opening,
    questions_to_ask: brief.slice(0, 3800),
  };
}
