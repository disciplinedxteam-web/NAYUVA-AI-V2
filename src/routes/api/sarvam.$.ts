import { createFileRoute } from '@tanstack/react-router';

// Server-side proxy for the Sarvam Web SDK signed-URL request. The API key never reaches the browser,
// and only an active caregiver demo session (HttpOnly cookie) can open a Svara voice session.
const ORG = '01a06c4c-1ad9-769a-9b30-14878bafef8a';
const WORKSPACE = '01a06c4c-1ae1-7d6f-a195-f7c92c3f2058';
const APP = 'Conversatio-1e149739-300e';

async function hash(value: string) {
  const bytes = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(value));
  return Array.from(new Uint8Array(bytes), (x) => x.toString(16).padStart(2, '0')).join('');
}
function cookie(request: Request, name: string) {
  const m = (request.headers.get('cookie') ?? '').match(new RegExp(`(?:^|;\\s*)${name}=([^;]+)`));
  return m?.[1] ? decodeURIComponent(m[1]) : null;
}

export const Route = createFileRoute('/api/sarvam/$')({
  server: {
    handlers: {
      GET: async ({ request }) => {
        const token = cookie(request, 'nayuva_demo');
        if (!token) return Response.json({ error: 'Unauthorized' }, { status: 401 });
        const { supabaseAdmin: db } = await import('@/integrations/supabase/client.server');
        const { data: session } = await db.from('demo_sessions').select('role,caregiver_profile_id')
          .eq('token_hash', await hash(token)).gt('expires_at', new Date().toISOString()).single();
        if (!session || session.role !== 'caregiver' || !session.caregiver_profile_id)
          return Response.json({ error: 'Unauthorized' }, { status: 401 });
        const url = new URL(request.url);
        const key = process.env['SARVAM_API_KEY'];
        if (!key) return Response.json({ error: 'Voice agent not configured' }, { status: 500 });
        const upstream = new URL(`https://apps.sarvam.ai/api/app-runtime/orgs/${ORG}/workspaces/${WORKSPACE}/apps/${APP}/url`);
        // Identity is always the authorized caregiver profile from the server session, never client input.
        upstream.searchParams.set('user_identifier', session.caregiver_profile_id);
        upstream.searchParams.set('user_identifier_type', 'custom');
        for (const p of ['interaction_type', 'version'])
          { const v = url.searchParams.get(p); if (v) upstream.searchParams.set(p, v); }
        const res = await fetch(upstream, { headers: { 'X-API-Key': key } });
        const body = await res.text();
        if (!res.ok) console.error('[sarvam] signed url failed', res.status, body.slice(0, 300));
        return new Response(body, { status: res.status, headers: { 'content-type': 'application/json' } });
      },
    },
  },
});
