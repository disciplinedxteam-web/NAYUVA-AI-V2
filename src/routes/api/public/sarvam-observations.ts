import { createFileRoute } from '@tanstack/react-router';
import { z } from 'zod';

/** Sarvam tool `submit_observation`: stores each confirmed caregiver answer against the live check-in. */
const schema = z.object({ check_in_id: z.string().uuid(), question_id: z.string().trim().min(1).max(80), answer: z.string().trim().min(1).max(3000), topic: z.string().max(80).optional() });
function unwrap(body: unknown): unknown {
  const o = (body ?? {}) as Record<string, unknown>;
  let p = o['payload'];
  if (typeof p === 'string') { try { p = JSON.parse(p); } catch { p = {}; } }
  return { ...o, ...((p ?? {}) as object) };
}

export const Route = createFileRoute('/api/public/sarvam-observations')({
  server: {
    handlers: {
      POST: async ({ request }) => {
        const required = process.env['SVARA_TOOL_KEY'];
        if (required && request.headers.get('x-api-key') !== required) return Response.json({ saved: false, error: 'unauthorized' }, { status: 401 });
        let body: unknown = {}; try { body = await request.json(); } catch { /* empty */ }
        const r = schema.safeParse(unwrap(body));
        if (!r.success) return Response.json({ saved: false, error: 'check_in_id, question_id and answer are required' }, { status: 400 });
        const { supabaseAdmin: db } = await import('@/integrations/supabase/client.server');
        const { data: s } = await db.from('checkin_sessions').select('id,baby_id,status,created_at').eq('id', r.data.check_in_id).maybeSingle();
        if (!s || s.status === 'submitted' || Date.now() - new Date(s.created_at).getTime() > 2 * 86400000) return Response.json({ saved: false, error: 'check-in not found' }, { status: 404 });
        const { data: q } = await db.from('question_bank').select('topic').eq('id', r.data.question_id).maybeSingle();
        const topic = q?.topic ?? r.data.topic ?? (r.data.question_id === 'q_final_concerns' ? 'concerns' : r.data.question_id.replace(/^topic_/, ''));
        // Idempotent per question: a repeated answer replaces the earlier one.
        await db.from('caregiver_responses').delete().eq('session_id', s.id).eq('question_id', r.data.question_id);
        const { error } = await db.from('caregiver_responses').insert({ session_id: s.id, baby_id: s.baby_id, question_id: r.data.question_id, topic, original_text: r.data.answer, confirmation_status: 'confirmed_in_call' });
        if (error) return Response.json({ saved: false, error: 'could not save' }, { status: 500 });
        return Response.json({ saved: true, status: 'saved', urgency_note: 'Saved for care team review. If the caregiver describes an emergency, tell them to call emergency services or the care team now.' });
      },
    },
  },
});
