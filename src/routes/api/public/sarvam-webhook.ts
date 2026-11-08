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
  if (['connected', 'completed', 'complete', 'success', 'successful', 'answered', 'ended', 'call_ended', 'hangup', 'hung_up', 'finished'].includes(v)) return 'completed';
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
        if (s.status === 'submitted' || s.status === 'awaiting_confirmation') return Response.json({ ok: true, duplicate: true });

        const status = mapStatus(p.status);
        const lines = (p.interaction_transcript ?? []).map((t) => { const who = String(t.role ?? (t as Record<string, unknown>)['speaker'] ?? '').toLowerCase(); return { role: ['user', 'caregiver', 'customer', 'human'].includes(who) ? 'user' : 'bot', content: String(t.en_text ?? t.text ?? t.content ?? '').trim().slice(0, 6000) }; }).filter((l) => l.content);
        const { data: answers } = await db.from('caregiver_responses').select('topic,original_text').eq('session_id', s.id).order('created_at');
        const confirmed = (answers ?? []).filter((a) => a.original_text);
        const { isConversationComplete } = await import('@/lib/svara-agent-contract');
        // Same rule as the website: a call that ends too early never becomes a card.
        const hasCaregiver = confirmed.length >= 2 || isConversationComplete(lines);
        const evidence = lines.some((l) => l.role === 'user') ? lines : confirmed.flatMap((a) => [{ role: 'bot', content: `[${a.topic}]` }, { role: 'user', content: String(a.original_text) }]);
        const summaryJson = { provider_status: p.status ?? null, duration_seconds: p.duration ?? null, final_agent_variables: (p.final_agent_variables ?? null) as Json, received_at: new Date().toISOString() };
        await db.from('checkin_sessions').update({
          call_status: status === 'completed' && !hasCaregiver ? 'completed_no_transcript' : status,
          failure_code: status === 'completed' ? (hasCaregiver ? null : 'no_caregiver_transcript') : (p.status ?? 'unknown'),
          transcript: evidence.length ? (evidence as Json) : s.transcript,
          summary: summaryJson as Json,
          completed_at: new Date().toISOString(),
          status: status === 'completed' && hasCaregiver ? s.status : 'incomplete',
        }).eq('id', s.id);

        if (status !== 'completed' || !hasCaregiver) return Response.json({ ok: true, draft: false });
        // Draft only: the caregiver must review and confirm before anything reaches the care team.
        // Prefer the answers Svara confirmed during the call (saved via the observations tool); add the transcript as context.
        const qa = confirmed.flatMap((a) => [{ role: 'bot', content: `[${a.topic}]` }, { role: 'user', content: String(a.original_text) }]);
        const source = qa.length ? [...qa, ...lines] : lines;
        let draft: Record<string, unknown> | null = null;
        const { draftSvaraSummary } = await import('@/lib/care.functions');
        for (let i = 0; i < 2 && !draft; i++) {
          try { draft = { ...(await draftSvaraSummary(source, s.plan_snapshot)), source: qa.length ? 'confirmed_answers' : 'sarvam_llm' }; }
          catch (e) { console.error('svara draft attempt failed', e instanceof Error ? e.message : 'unknown'); }
        }
        if (!draft) {
          // Structured fallback (never a paragraph): one topic per confirmed answer, queued for review.
          const { normalizeCard } = await import('@/lib/care-card');
          const items = confirmed;
          if (!items.length) { await db.from('checkin_sessions').update({ failure_code: 'summary_unavailable' }).eq('id', s.id); return Response.json({ ok: true, draft: false }); }
          const card = normalizeCard({ topics: items.map((a) => ({ title: a.topic, finding: String(a.original_text).split(/\s+/).slice(0, 6).join(' '), status: 'Not discussed', quote: a.original_text })), priority: 'Review Needed', priorityReason: 'Automatic summary unavailable; please review' });
          draft = { summary: JSON.stringify(card), card, source: 'confirmed_answers_fallback' };
        }
        await db.from('checkin_sessions').update({ status: 'awaiting_confirmation', summary: { ...summaryJson, ...draft } as Json }).eq('id', s.id).neq('status', 'submitted');
        // Delivery is exclusively the caregiver's existing Approve & Send action.
        return Response.json({ ok: true, draft: true, submitted: false });
      },
    },
  },
});
