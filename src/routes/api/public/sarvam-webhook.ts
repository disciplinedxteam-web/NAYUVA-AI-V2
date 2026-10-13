import { createFileRoute } from '@tanstack/react-router';
import { z } from 'zod';
import type { Json } from '@/integrations/supabase/types';

const turn = z.object({ role: z.string().optional(), en_text: z.string().nullish(), text: z.string().nullish(), content: z.string().nullish() }).passthrough();
const payload = z.object({
  attempt_id: z.string().min(1).max(200),
  status: z.string().max(50).optional(),
  duration: z.number().nullish(),
  interaction_transcript: z.array(turn).max(500).nullish(),
  final_agent_variables: z.record(z.string(), z.unknown()).nullish(),
  metadata: z.record(z.string(), z.unknown()).nullish(),
}).passthrough();

function mapStatus(s: string | undefined) {
  const v = (s ?? '').toLowerCase();
  if (['connected', 'completed', 'success'].includes(v)) return 'completed';
  if (['no_answer', 'not_answered', 'unanswered'].includes(v)) return 'no_answer';
  if (v === 'busy') return 'busy';
  return 'failed';
}

export const Route = createFileRoute('/api/public/sarvam-webhook')({
  server: {
    handlers: {
      GET: async () => Response.json({ ok: true }),
      POST: async ({ request }) => {
        const key = process.env['SARVAM_API_KEY'];
        if (!key) return new Response('Not configured', { status: 503 });
        const token = new URL(request.url).searchParams.get('token') ?? '';
        let raw: unknown;
        try { raw = await request.json(); } catch { return new Response('Invalid JSON', { status: 400 }); }
        const parsed = payload.safeParse(raw);
        if (!parsed.success) return new Response('Invalid payload', { status: 400 });
        const p = parsed.data;
        const { webhookToken, safeEqual } = await import('@/lib/svara-webhook-auth');
        const { supabaseAdmin: db } = await import('@/integrations/supabase/client.server');
        // Match only by attempt_id saved when we placed the call; metadata never selects a record by itself.
        const { data: s } = await db.from('checkin_sessions').select('*').eq('attempt_id', p.attempt_id).maybeSingle();
        if (!s) return new Response('Unknown attempt', { status: 404 });
        if (!safeEqual(token, await webhookToken(s.id, key))) return new Response('Unauthorized', { status: 401 });
        if (s.status === 'submitted') return Response.json({ ok: true, duplicate: true });

        const status = mapStatus(p.status);
        const lines = (p.interaction_transcript ?? []).map((t) => ({ role: t.role === 'user' ? 'user' : 'bot', content: (t.en_text ?? t.text ?? t.content ?? '').trim().slice(0, 6000) })).filter((l) => l.content);
        const hasCaregiver = lines.some((l) => l.role === 'user');
        const summaryJson = { provider_status: p.status ?? null, duration_seconds: p.duration ?? null, final_agent_variables: (p.final_agent_variables ?? null) as Json, received_at: new Date().toISOString() };
        await db.from('checkin_sessions').update({
          call_status: status === 'completed' && !hasCaregiver ? 'completed_no_transcript' : status,
          failure_code: status === 'completed' ? (hasCaregiver ? null : 'no_caregiver_transcript') : (p.status ?? 'unknown'),
          transcript: lines.length ? (lines as Json) : s.transcript,
          summary: summaryJson as Json,
          completed_at: new Date().toISOString(),
          status: status === 'completed' && hasCaregiver ? s.status : 'incomplete',
        }).eq('id', s.id);

        if (status !== 'completed' || !hasCaregiver) return Response.json({ ok: true, draft: false });
        // Draft only: the caregiver must review and confirm before anything reaches the care team.
        const caregiverWords = lines.filter((l) => l.role === 'user').map((l) => l.content).join(' / ');
        let draft: Record<string, unknown> = { summary: `Phone check-in. Caregiver said: ${caregiverWords}`.slice(0, 5000), observations: [], missingInformation: [], source: 'caregiver_words' };
        try {
          const { draftSvaraSummary } = await import('@/lib/care.functions');
          draft = { ...(await draftSvaraSummary(lines, s.plan_snapshot)), source: 'sarvam_llm' };
        } catch (e) { console.error('svara draft fallback', e instanceof Error ? e.message : 'unknown'); }
        await db.from('checkin_sessions').update({ status: 'awaiting_confirmation', summary: { ...summaryJson, ...draft } as Json }).eq('id', s.id).neq('status', 'submitted');
        return Response.json({ ok: true, draft: true });
      },
    },
  },
});
