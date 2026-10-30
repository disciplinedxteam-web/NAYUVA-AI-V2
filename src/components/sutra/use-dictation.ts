import { useEffect, useRef, useState } from 'react';
import { useServerFn } from '@tanstack/react-start';
import { transcribeSpeech } from '@/lib/care.functions';
/** Sutra dictation always uses Sarvam speech-to-text (auto language detection), so Hindi and regional speech is written in its own script. */
export function useSutraDictation(value: string, onChange: (text: string) => void, _language?: string) {
 const [listening,setListening] = useState(false), [processing,setProcessing] = useState(false), [error,setError] = useState(''); const active = useRef<MediaRecorder | null>(null); const change = useRef(onChange); change.current = onChange; const stt = useServerFn(transcribeSpeech);
 useEffect(() => () => { const r = active.current; if (r) { r.stop(); r.stream.getTracks().forEach(t => t.stop()); } }, []);
 async function toggle() { if (listening) { active.current?.stop(); setListening(false); return; } setError(''); const base = value ? value + ' ' : '';
 try { const stream = await navigator.mediaDevices.getUserMedia({audio:true}); const r = new MediaRecorder(stream); const chunks: Blob[] = []; r.ondataavailable = e => { if(e.data.size) chunks.push(e.data); }; r.onstop = async() => { stream.getTracks().forEach(t => t.stop()); setListening(false); setProcessing(true); try { const blob = new Blob(chunks,{type:r.mimeType}); const bytes = new Uint8Array(await blob.arrayBuffer()); let bin = ''; for(let i=0;i<bytes.length;i+=32768) bin += String.fromCharCode(...bytes.subarray(i,i+32768)); const result = await stt({data:{audio:btoa(bin),mime:blob.type,language:'unknown'}}); change.current(base+result.transcript); } catch(e) { setError(e instanceof Error?e.message:'Could not transcribe audio.'); } finally {setProcessing(false);} }; active.current=r; r.start(); setListening(true); } catch {setError('Microphone access unavailable. Please type your question.');} }
 return {listening,processing,error,toggle:()=>void toggle()};
}
