/** Per-check-in webhook token: HMAC(check_in_id) keyed by the server-side Sarvam key. Sarvam has no signature header, so the token travels in the callback URL. */
export async function webhookToken(checkInId: string, secret: string) {
  const k = await crypto.subtle.importKey('raw', new TextEncoder().encode(secret), { name: 'HMAC', hash: 'SHA-256' }, false, ['sign']);
  const sig = await crypto.subtle.sign('HMAC', k, new TextEncoder().encode(`svara-webhook:${checkInId}`));
  return Array.from(new Uint8Array(sig), (x) => x.toString(16).padStart(2, '0')).join('');
}
export function safeEqual(a: string, b: string) {
  if (a.length !== b.length) return false;
  let r = 0; for (let i = 0; i < a.length; i++) r |= a.charCodeAt(i) ^ b.charCodeAt(i);
  return r === 0;
}
