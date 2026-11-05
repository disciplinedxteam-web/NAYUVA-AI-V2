import { createFileRoute } from '@tanstack/react-router';
import { z } from 'zod';

/** Sarvam tool `fetch_check_in_questions`: returns this baby's personalised, approved questions. */
const idSchema = z.string().uuid();
function readId(body: unknown): string | null {
  const o = (body ?? {}) as Record<string, unknown>;
  const inner = typeof o['payload'] === 'string' ? (() => { try { return JSON.parse(o['payload'] as string); } catch { return {}; } })() : o['payload'];
  for (const v of [(inner as Record<string, unknown> | undefined)?.['check_in_id'], o['check_in_id'], o['session_id']]) { const r = idSchema.safeParse(typeof v === 'string' ? v.trim() : v); if (r.success) return r.data; }
  return null;
}
const json = (b: unknown, status = 200) => Response.json(b, { status });

export const Route = createFileRoute('/api/public/sarvam-questions')({
  server: {
    handlers: {
      POST: async ({ request }) => {
        const required = process.env['SVARA_TOOL_KEY'];
        if (required && request.headers.get('x-api-key') !== required) return json({ error: 'unauthorized' }, 401);
        let body: unknown = {}; try { body = await request.json(); } catch { /* empty */ }
        const id = readId(body);
        if (!id) return json({ error: 'check_in_id missing or invalid' }, 400);
        const { supabaseAdmin: db } = await import('@/integrations/supabase/client.server');
        const { data: s } = await db.from('checkin_sessions').select('id,baby_id,status,created_at,plan_snapshot,question_ids').eq('id', id).maybeSingle();
        // Only live, recent sessions are a valid capability.
        if (!s || s.status === 'submitted' || Date.now() - new Date(s.created_at).getTime() > 2 * 86400000) return json({ error: 'check-in not found' }, 404);
        // A tool call proves the caregiver answered: show the live state on screen.
        await db.from('checkin_sessions').update({ call_status: 'in_progress' }).eq('id', s.id).in('call_status', ['initiating', 'call_placed']);
        const { data: b } = await db.from('care_profiles').select('baby_name,caregiver_name,plan,plan_version').eq('id', s.baby_id).single();
        if (!b) return json({ error: 'check-in not found' }, 404);
        const plan = (s.plan_snapshot ?? b.plan ?? {}) as Record<string, unknown>;
        const topics = (Array.isArray(plan['categories']) ? plan['categories'] : []) as string[];
        const [{ data: qs }, { data: cards }, { data: ins }, { data: responses }] = await Promise.all([
          db.from('question_bank').select('id,topic,first_wording,returning_wording').eq('active', true).eq('approval_status', 'approved').in('topic', topics.length ? topics : ['__none__']),
          db.from('health_cards').select('category,quote,summary_text,created_at').eq('baby_id', s.baby_id).order('created_at', { ascending: false }).limit(3),
          db.from('followup_instructions').select('instruction,expires_on').eq('baby_id', s.baby_id).eq('status', 'active'),
          db.from('caregiver_responses').select('topic,original_text,created_at').eq('baby_id',s.baby_id).neq('session_id',s.id).order('created_at',{ascending:false}).limit(60),
        ]);
        const returning = (cards?.length ?? 0) > 0;
        const { parseCard } = await import('@/lib/care-card');
        const lastFor = (topic: string) => { const answer=responses?.find(a=>a.topic.toLowerCase()===topic.toLowerCase()&&a.original_text); if(answer)return `Previous caregiver answer: ${answer.original_text}`; for (const c of cards ?? []) { const k = parseCard(c.summary_text); const t = k?.topics.find((x) => x.title.toLowerCase() === topic.toLowerCase()); if (t) return `Last time: ${t.finding}`; } return ''; };
        const { todaysCheckin, SVARA_STYLE } = await import('@/lib/day-protocol');
        const { previousTopics } = await import('@/lib/svara-context.server');
        const day = todaysCheckin({ ...(b.plan as Record<string, unknown>), babyName: b.baby_name }, Date.now(), await previousTopics(db, s.baby_id));
        const questions = day.questions.map((q, i) => ({ question_id: `day${day.day}_q${i + 1}`, topic: q.topic, question_text: q.text, answer_type: 'free_text', context_note: q.source === 'final' || q.source === 'followup' ? '' : lastFor(q.topic), ...(q.source === 'final' ? { mandatory: true, ask_last: true } : {}) }));
        const missingTopics: string[] = []; void qs; void topics;
        const today = new Date().toISOString().slice(0, 10);
        return json({
          session_id: s.id,
          caregiver_name: b.caregiver_name,
          baby_name: b.baby_name,
          session_type: returning ? 'returning' : 'first',
          day_of_life: day.day,
          opening_line: day.opening,
          due_topics: day.questions.map((q) => q.topic),
          missing_approved_topics: missingTopics,
          previous_answers: responses ?? [],
          instructions: SVARA_STYLE + " Always start by introducing yourself as Svara from Nayuva AI, as in opening_line. Ask any follow-up questions about the last check-in first. Never diagnose or give treatment advice. Ask only the returned approved questions, one at a time. Use context_note and previous_answers to ask what changed; do not repeat answered questions within this check-in. Never invent generic replacement questions. Save each exact answer with submit_observation. Ask the mandatory final concern last.",
          previous_updates: (cards ?? []).map((c) => { const k = parseCard(c.summary_text); return k ? k.topics.map((t) => `${t.title}: ${t.finding}`).join('; ') : c.category; }),
          clinician_instructions: (ins ?? []).filter((i) => !i.expires_on || i.expires_on >= today).map((i) => i.instruction),
          questions,
          closing_note: 'After all questions are answered, thank the caregiver warmly in one or two sentences, say their answers will reach the care team, and end the call.',
        });
      },
    },
  },
});
