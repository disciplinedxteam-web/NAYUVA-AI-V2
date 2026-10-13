import { createFileRoute } from '@tanstack/react-router';
import { z } from 'zod';
import { FINAL_CONCERN_QUESTION } from '@/lib/care-domain';

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
        const { data: s } = await db.from('checkin_sessions').select('id,baby_id,status,created_at').eq('id', id).maybeSingle();
        // Only live, recent sessions are a valid capability.
        if (!s || s.status === 'submitted' || Date.now() - new Date(s.created_at).getTime() > 2 * 86400000) return json({ error: 'check-in not found' }, 404);
        const { data: b } = await db.from('care_profiles').select('baby_name,caregiver_name,plan,plan_version').eq('id', s.baby_id).single();
        if (!b) return json({ error: 'check-in not found' }, 404);
        const plan = (b.plan ?? {}) as Record<string, unknown>;
        const topics = (Array.isArray(plan['categories']) ? plan['categories'] : []) as string[];
        const [{ data: qs }, { data: cards }, { data: ins }] = await Promise.all([
          db.from('question_bank').select('id,topic,first_wording,returning_wording').eq('active', true).eq('approval_status', 'approved').in('topic', topics.length ? topics : ['__none__']),
          db.from('health_cards').select('category,quote,summary_text,created_at').eq('baby_id', s.baby_id).order('created_at', { ascending: false }).limit(3),
          db.from('followup_instructions').select('instruction,expires_on').eq('baby_id', s.baby_id).eq('status', 'active'),
        ]);
        const returning = (cards?.length ?? 0) > 0;
        const { parseCard } = await import('@/lib/care-card');
        const lastFor = (topic: string) => { for (const c of cards ?? []) { const k = parseCard(c.summary_text); const t = k?.topics.find((x) => x.title.toLowerCase() === topic.toLowerCase()); if (t) return `Last time: ${t.finding}`; } return ''; };
        const ordered = topics.flatMap((t) => (qs ?? []).filter((q) => q.topic === t).slice(0, 1));
        const questions = ordered.map((q) => ({ question_id: q.id, topic: q.topic, question_text: (returning && q.returning_wording) || q.first_wording, answer_type: 'free_text', context_note: lastFor(q.topic) }));
        // Topics without an approved question still get asked in plain wording.
        for (const t of topics) if (!ordered.some((q) => q.topic === t)) questions.push({ question_id: `topic_${t.toLowerCase().replace(/[^a-z0-9]+/g, '_')}`, topic: t, question_text: `How has ${b.baby_name}'s ${t.toLowerCase()} been since the last check-in?`, answer_type: 'free_text', context_note: lastFor(t) });
        questions.push({ question_id: 'q_final_concerns', topic: 'concerns', question_text: FINAL_CONCERN_QUESTION, answer_type: 'free_text', context_note: '', ...{ mandatory: true, ask_last: true } });
        const today = new Date().toISOString().slice(0, 10);
        return json({
          session_id: s.id,
          caregiver_name: b.caregiver_name,
          baby_name: b.baby_name,
          session_type: returning ? 'returning' : 'first',
          due_topics: topics,
          previous_updates: (cards ?? []).map((c) => { const k = parseCard(c.summary_text); return k ? k.topics.map((t) => `${t.title}: ${t.finding}`).join('; ') : c.category; }),
          clinician_instructions: (ins ?? []).filter((i) => !i.expires_on || i.expires_on >= today).map((i) => i.instruction),
          questions,
          closing_note: 'After all questions are answered, thank the caregiver and confirm their answers have been saved for the care team.',
        });
      },
    },
  },
});
