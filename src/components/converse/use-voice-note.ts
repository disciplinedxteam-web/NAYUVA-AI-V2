import { useEffect, useRef, useState } from 'react';

/** Records complete audio only. No speech-to-text or automatic sending. */
export function useVoiceNote(onReady: (file: File) => void, onError: (message: string) => void) {
  const [recording, setRecording] = useState(false), [starting, setStarting] = useState(false), [seconds, setSeconds] = useState(0);
  const recorder = useRef<MediaRecorder | null>(null), stream = useRef<MediaStream | null>(null), chunks = useRef<Blob[]>([]), cancelled = useRef(false), mounted = useRef(true);
  const ready = useRef(onReady), error = useRef(onError);
  ready.current = onReady; error.current = onError;
  useEffect(() => { mounted.current = true; return () => { mounted.current = false; cancelled.current = true; if (recorder.current?.state === 'recording') recorder.current.stop(); stream.current?.getTracks().forEach(t => t.stop()); }; }, []);
  useEffect(() => { if (!recording) return; const timer = setInterval(() => setSeconds(n => n + 1), 1000); return () => clearInterval(timer); }, [recording]);
  function stop(discard = false) { cancelled.current = discard; if (recorder.current?.state === 'recording') recorder.current.stop(); }
  async function start() {
    if (starting || recording) return;
    if (!navigator.mediaDevices?.getUserMedia || typeof MediaRecorder === 'undefined') { error.current('Voice recording is not supported in this browser.'); return; }
    setStarting(true);
    try {
      const media = await navigator.mediaDevices.getUserMedia({ audio: true });
      if (!mounted.current) { media.getTracks().forEach(t => t.stop()); return; }
      stream.current = media; chunks.current = []; cancelled.current = false;
      const mime = ['audio/webm;codecs=opus', 'audio/mp4', 'audio/ogg;codecs=opus'].find(m => MediaRecorder.isTypeSupported(m));
      const rec = new MediaRecorder(media, mime ? { mimeType: mime } : {}); recorder.current = rec;
      let bytes = 0;
      rec.ondataavailable = event => { if (!event.data.size) return; chunks.current.push(event.data); bytes += event.data.size; if (bytes > 4_000_000) { cancelled.current = true; if (rec.state === 'recording') rec.stop(); if (mounted.current) error.current('Voice message is too large. Please record a shorter message.'); } };
      rec.onerror = () => { cancelled.current = true; media.getTracks().forEach(t => t.stop()); if (mounted.current) { setRecording(false); error.current('Recording failed. Please try again.'); } };
      rec.onstop = () => {
        media.getTracks().forEach(t => t.stop()); stream.current = null;
        if (!mounted.current) return;
        setRecording(false);
        if (cancelled.current) return;
        const blob = new Blob(chunks.current, { type: rec.mimeType || 'audio/webm' });
        if (!blob.size) { error.current('No audio was recorded. Please try again.'); return; }
        const ext = blob.type.includes('mp4') ? 'm4a' : blob.type.includes('ogg') ? 'ogg' : 'webm';
        ready.current(new File([blob], `Voice message.${ext}`, { type: blob.type }));
      };
      setSeconds(0); rec.start(1000); setRecording(true);
    } catch { stream.current?.getTracks().forEach(t => t.stop()); stream.current = null; if (mounted.current) error.current('Microphone access is needed to record a voice message. Please allow it and try again.'); }
    finally { if (mounted.current) setStarting(false); }
  }
  return { recording, starting, seconds, start, stop };
}