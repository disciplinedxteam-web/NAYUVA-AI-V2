import { useEffect, useRef, useState } from 'react';
import { useServerFn } from '@tanstack/react-start';
import { transcribeSpeech } from '@/lib/care.functions';

const LIVE_EVERY_MS = 2200;
async function toBase64(blob: Blob) {
  const bytes = new Uint8Array(await blob.arrayBuffer()); let bin = '';
  for (let i = 0; i < bytes.length; i += 32768) bin += String.fromCharCode(...bytes.subarray(i, i + 32768));
  return btoa(bin);
}

/**
 * Sutra dictation always uses Sarvam speech-to-text (auto language detection), so Hindi and regional
 * speech is written in its own script. While recording, the audio so far is re-transcribed every couple
 * of seconds and written into the typing bar live; a final pass runs when the mic stops.
 */
export function useSutraDictation(value: string, onChange: (text: string) => void, _language?: string) {
  const [listening, setListening] = useState(false), [processing, setProcessing] = useState(false), [error, setError] = useState('');
  const active = useRef<MediaRecorder | null>(null), timer = useRef<number>(0), session = useRef(0);
  const change = useRef(onChange); change.current = onChange; const stt = useServerFn(transcribeSpeech);
  useEffect(() => () => { session.current++; clearInterval(timer.current); const r = active.current; if (r && r.state !== 'inactive') { r.stop(); r.stream.getTracks().forEach(t => t.stop()); } }, []);

  async function toggle() {
    if (listening) { clearInterval(timer.current); if (active.current?.state === 'recording') active.current.requestData(); active.current?.stop(); setListening(false); return; }
    setError(''); const base = value.trim() ? value.trim() + ' ' : ''; const id = ++session.current;
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: { echoCancellation: true, noiseSuppression: true } });
      const r = new MediaRecorder(stream); const chunks: Blob[] = []; let inflight = false, finished = false, lastSize = 0;
      const transcribe = async () => { const blob = new Blob(chunks, { type: r.mimeType }); const res = await stt({ data: { audio: await toBase64(blob), mime: blob.type, language: 'unknown' } }); return res.transcript; };
      r.ondataavailable = e => { if (e.data.size) chunks.push(e.data); };
      timer.current = window.setInterval(() => {
        if (r.state === 'recording') r.requestData();
        const size = chunks.reduce((n, c) => n + c.size, 0);
        if (inflight || finished || size === lastSize || size < 4000) return;
        inflight = true; lastSize = size;
        transcribe().then(t => { if (!finished && id === session.current && t) change.current(base + t); }).catch(() => {}).finally(() => { inflight = false; });
      }, LIVE_EVERY_MS);
      r.onstop = async () => {
        finished = true; clearInterval(timer.current); stream.getTracks().forEach(t => t.stop()); setListening(false);
        if (id !== session.current || !chunks.length) return;
        setProcessing(true);
        try { const t = await transcribe(); if (id === session.current) change.current(base + t); }
        catch (e) { if (id === session.current) setError(e instanceof Error ? e.message : 'Could not transcribe audio.'); }
        finally { if (id === session.current) setProcessing(false); }
      };
      active.current = r; r.start(500); setListening(true);
    } catch { setError('Microphone access unavailable. Please type your question.'); }
  }
  return { listening, processing, error, toggle: () => void toggle() };
}
