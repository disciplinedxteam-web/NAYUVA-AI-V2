import { beforeEach, describe, expect, it, vi } from 'vitest';
const mocks = vi.hoisted(() => ({ from: vi.fn(), rpc: vi.fn(), draft: vi.fn(), token: vi.fn(), session: {} as Record<string, unknown>, updates: [] as Record<string, unknown>[] }));
vi.mock('@tanstack/react-router', () => ({ createFileRoute: () => (config: unknown) => config }));
vi.mock('@/integrations/supabase/client.server', () => ({ supabaseAdmin: { from: mocks.from, rpc: mocks.rpc } }));
vi.mock('@/lib/svara-webhook-auth', () => ({ webhookToken: mocks.token, safeEqual: (a: string, b: string) => a === b }));
vi.mock('@/lib/care.functions', () => ({ draftSvaraSummary: mocks.draft }));
import { Route } from '@/routes/api/public/sarvam-webhook';
const handler = (Route as unknown as { server: { handlers: { POST: (args: { request: Request }) => Promise<Response> } } }).server.handlers.POST;
async function callback(status = 'completed', token = 'test-signature') {
  return handler({ request: new Request(`http://localhost/api/public/sarvam-webhook?token=${token}`, { method: 'POST', body: JSON.stringify({ attempt_id: 'synthetic-attempt', status, interaction_transcript: [{ role: 'user', text: 'Four feeds' }, { role: 'user', text: 'Six nappies' }] }) }) });
}
describe('phone webhook never auto-delivers', () => {
  beforeEach(() => {
    vi.stubEnv('SARVAM_API_KEY', 'synthetic-test-key'); vi.clearAllMocks(); mocks.updates = [];
    mocks.session = { id: 'synthetic-session', baby_id: 'synthetic-baby', status: 'in_progress', plan_snapshot: {} };
    mocks.token.mockResolvedValue('test-signature');
    mocks.draft.mockResolvedValue({ summary: '{"synthetic":"draft"}' });
    mocks.from.mockImplementation((table: string) => {
      const result = { data: table === 'caregiver_responses' ? [{ topic: 'Feeding', original_text: 'Four feeds' }, { topic: 'Urine', original_text: 'Six nappies' }] : mocks.session, error: null };
      const q: Record<string, unknown> = {};
      for (const method of ['select', 'eq', 'neq', 'order']) q[method] = () => q;
      q['maybeSingle'] = () => Promise.resolve(result);
      q['update'] = (patch: Record<string, unknown>) => { mocks.updates.push(patch); return q; };
      q['then'] = (resolve: (value: unknown) => unknown) => Promise.resolve(result).then(resolve);
      return q;
    });
  });
  it('persists a completed call as a reviewable draft without creating a Health Card', async () => {
    const response = await callback();
    expect(await response.json()).toEqual({ ok: true, draft: true, submitted: false });
    expect(mocks.updates.at(-1)?.['status']).toBe('awaiting_confirmation');
    expect(mocks.rpc).not.toHaveBeenCalled();
    expect(mocks.from.mock.calls.map(c => c[0])).not.toContain('health_cards');
  });
  it('preserves pending drafts on repeated provider callbacks', async () => {
    mocks.session['status'] = 'awaiting_confirmation';
    expect(await (await callback()).json()).toEqual({ ok: true, duplicate: true });
    expect(mocks.updates).toHaveLength(0); expect(mocks.draft).not.toHaveBeenCalled();
  });
  it('does not draft or send unanswered calls', async () => {
    expect(await (await callback('no_answer')).json()).toEqual({ ok: true, draft: false });
    expect(mocks.draft).not.toHaveBeenCalled(); expect(mocks.rpc).not.toHaveBeenCalled();
  });
  it('rejects unauthenticated callbacks before changing a record', async () => {
    expect((await callback('completed', 'wrong-signature')).status).toBe(401);
    expect(mocks.updates).toHaveLength(0); expect(mocks.rpc).not.toHaveBeenCalled();
  });
});