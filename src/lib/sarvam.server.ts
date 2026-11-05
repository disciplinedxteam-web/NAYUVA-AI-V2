/**
 * Shared server-only Sarvam model client (STT, LLM, TTS) on api.sarvam.ai.
 * Model APIs use the `api-subscription-key` header; the Conversational Apps /
 * outbound platform (apps.sarvam.ai) uses `X-API-Key` and lives in care.functions.
 * Key: SARVAM_MODELS_API_KEY (falls back to SARVAM_API_KEY).
 */
const BASE = 'https://api.sarvam.ai';
export class SarvamError extends Error { constructor(message: string, public code: string) { super(message); } }

function key() {
  const k = process.env['SARVAM_MODELS_API_KEY'] || process.env['SARVAM_API_KEY'];
  if (!k) throw new SarvamError('Sarvam language services are not configured.', 'not_configured');
  return k;
}

async function call(path: string, init: RequestInit, timeoutMs = 30000): Promise<Record<string, unknown>> {
  const cid = crypto.randomUUID();
  let res: Response;
  for (let attempt = 0; ; attempt++) {
    try {
      res = await fetch(BASE + path, { ...init, headers: { ...(init.headers as Record<string, string>), 'api-subscription-key': key() }, signal: AbortSignal.timeout(timeoutMs) });
    } catch {
      console.error('sarvam network', { cid, path });
      throw new SarvamError('Could not reach Sarvam. Please try again.', 'network_error');
    }
    if ((res.status === 429 || res.status >= 500) && attempt < 1) { await new Promise(r => setTimeout(r, 1200)); continue; }
    break;
  }
  const text = await res.text();
  if (!res.ok) {
    console.error('sarvam failed', { cid, path, status: res.status, body: text.slice(0, 300) });
    if (res.status === 401 || res.status === 403) throw new SarvamError('The Sarvam key does not have access to speech and language services yet.', 'auth_error');
    if (res.status === 402) throw new SarvamError('Sarvam has no credits available. Please replenish the Sarvam account to continue.', 'insufficient_credits');
    if (res.status === 429) throw new SarvamError('Sarvam is busy. Please try again shortly.', 'rate_limited');
    if (res.status === 400 || res.status === 422) throw new SarvamError('Sarvam could not process this request.', 'invalid_request');
    throw new SarvamError('Sarvam is unavailable right now.', 'provider_error');
  }
  try { return JSON.parse(text); } catch { throw new SarvamError('Unexpected Sarvam response.', 'bad_response'); }
}

export type ChatMsg = { role: 'system' | 'user' | 'assistant'; content: string };
export async function sarvamChat(messages: ChatMsg[], opts: { maxTokens?: number; temperature?: number } = {}) {
  const json = await call('/v1/chat/completions', {
    method: 'POST', headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ model: process.env['SARVAM_LLM_MODEL'] || 'sarvam-105b-conversations', messages, temperature: opts.temperature ?? 0.2, max_tokens: Math.max(4000, opts.maxTokens ?? 0) }),
  }, 60000);
  const choices = json['choices'] as { message?: { content?: string } }[] | undefined;
  const content = (choices?.[0]?.message?.content ?? '').replace(/<think>[\s\S]*?<\/think>/g, '').trim();
  if (!content) throw new SarvamError('Sarvam returned an empty answer.', 'empty');
  return content;
}

/** Extracts the first JSON object from an LLM answer. */
export function parseJsonObject(text: string): unknown {
  const s = text.indexOf('{'), e = text.lastIndexOf('}');
  if (s < 0 || e <= s) throw new SarvamError('The draft could not be structured.', 'bad_json');
  try { return JSON.parse(text.slice(s, e + 1)); } catch { throw new SarvamError('The draft could not be structured.', 'bad_json'); }
}

export async function sarvamTranscribe(audio: Blob, filename: string, language = 'unknown') {
  const form = new FormData();
  form.append('file', audio, filename);
  form.append('model', 'saarika:v2.5');
  form.append('language_code', language);
  const json = await call('/speech-to-text', { method: 'POST', body: form }, 45000);
  return { transcript: String(json['transcript'] ?? '').trim(), language: String(json['language_code'] ?? language) };
}

export const TTS_LANGUAGES = ['en-IN', 'hi-IN', 'bn-IN', 'gu-IN', 'kn-IN', 'ml-IN', 'mr-IN', 'od-IN', 'pa-IN', 'ta-IN', 'te-IN'] as const;
export async function sarvamSpeak(text: string, language: string) {
  const json = await call('/text-to-speech', {
    method: 'POST', headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ text: text.slice(0, 1500), target_language_code: language, model: 'bulbul:v3', speaker: 'ritu' }),
  });
  const audio = (json['audios'] as string[] | undefined)?.[0];
  if (!audio) throw new SarvamError('No audio was produced.', 'empty');
  return audio; // base64 WAV
}
