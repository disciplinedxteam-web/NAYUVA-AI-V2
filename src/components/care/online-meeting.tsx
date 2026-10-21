import { useEffect, useRef, useState } from 'react';
import { useServerFn } from '@tanstack/react-start';
import { ArrowLeft, Mic, MicOff, PhoneOff, Video, VideoOff, FileText, Loader2, ShieldCheck } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { supabase } from '@/integrations/supabase/client';
import { finishOnlineConsultation, generateLekhaDraft, getOnlineTranscript, joinOnlineAppointment, transcribeOnlineSegment } from '@/lib/care.functions';
import type { CareCard } from '@/lib/care-card';
import { TopicCards } from './topic-cards';

type Join = Awaited<ReturnType<typeof joinOnlineAppointment>>;
type Line = { event_key: string; speaker: string; content: string; spoken_at: string };
type Signal = { from: string; type: 'hello' | 'ready' | 'offer' | 'answer' | 'ice' | 'bye'; sdp?: RTCSessionDescriptionInit; candidate?: RTCIceCandidateInit };
const ICE: RTCConfiguration = { iceServers: [{ urls: ['stun:stun.l.google.com:19302', 'stun:stun1.l.google.com:19302'] }] };

function wav(samples: Float32Array, rate: number) {
  const buffer = new ArrayBuffer(44 + samples.length * 2), v = new DataView(buffer);
  const w = (o: number, t: string) => { for (let i = 0; i < t.length; i++) v.setUint8(o + i, t.charCodeAt(i)); };
  w(0, 'RIFF'); v.setUint32(4, 36 + samples.length * 2, true); w(8, 'WAVE'); w(12, 'fmt '); v.setUint32(16, 16, true); v.setUint16(20, 1, true); v.setUint16(22, 1, true); v.setUint32(24, rate, true); v.setUint32(28, rate * 2, true); v.setUint16(32, 2, true); v.setUint16(34, 16, true); w(36, 'data'); v.setUint32(40, samples.length * 2, true);
  samples.forEach((x, i) => v.setInt16(44 + i * 2, Math.max(-1, Math.min(1, x)) * 32767, true));
  const bytes = new Uint8Array(buffer); let bin = ''; for (let i = 0; i < bytes.length; i += 0x8000) bin += String.fromCharCode(...bytes.subarray(i, i + 0x8000)); return btoa(bin);
}

export function OnlineMeeting({ id, onClose }: { id: string; onClose: () => void }) {
  const join = useServerFn(joinOnlineAppointment), transcribe = useServerFn(transcribeOnlineSegment), transcript = useServerFn(getOnlineTranscript), finish = useServerFn(finishOnlineConsultation), draft = useServerFn(generateLekhaDraft);
  const [consent, setConsent] = useState(false), [info, setInfo] = useState<Join | null>(null), [busy, setBusy] = useState(false), [error, setError] = useState('');
  const [peer, setPeer] = useState<'waiting' | 'connecting' | 'connected'>('waiting'), [muted, setMuted] = useState(false), [camOff, setCamOff] = useState(false);
  const [lines, setLines] = useState<Line[]>([]), [card, setCard] = useState<CareCard | null>(null), [ending, setEnding] = useState(false), [ended, setEnded] = useState(false);
  const localVideo = useRef<HTMLVideoElement>(null), remoteVideo = useRef<HTMLVideoElement>(null);
  const local = useRef<MediaStream | null>(null), pc = useRef<RTCPeerConnection | null>(null), chan = useRef<ReturnType<typeof supabase.channel> | null>(null);
  const pendingIce = useRef<RTCIceCandidateInit[]>([]);
  const audio = useRef<{ ctx: AudioContext; proc: ScriptProcessorNode } | null>(null), buf = useRef<Float32Array[]>([]), count = useRef(0), mutedRef = useRef(false), connectedRef = useRef(false), started = useRef(Date.now());

  function cleanup() {
    chan.current?.send({ type: 'broadcast', event: 'signal', payload: { from: info?.role, type: 'bye' } });
    pc.current?.close(); pc.current = null;
    audio.current?.proc.disconnect(); void audio.current?.ctx.close(); audio.current = null;
    local.current?.getTracks().forEach(t => t.stop()); local.current = null;
    if (chan.current) void supabase.removeChannel(chan.current); chan.current = null;
  }
  useEffect(() => () => cleanup(), []); // eslint-disable-line react-hooks/exhaustive-deps

  function send(s: Omit<Signal, 'from'>, role: string) { void chan.current?.send({ type: 'broadcast', event: 'signal', payload: { ...s, from: role } }); }
  function newPeer(role: string) {
    pc.current?.close();
    pendingIce.current = []; const p = new RTCPeerConnection(ICE); pc.current = p; setPeer('connecting');
    local.current?.getTracks().forEach(t => p.addTrack(t, local.current!));
    p.onicecandidate = e => { if (e.candidate) send({ type: 'ice', candidate: e.candidate.toJSON() }, role); };
    p.ontrack = e => { if (remoteVideo.current && e.streams[0]) remoteVideo.current.srcObject = e.streams[0]; };
    p.onconnectionstatechange = () => {
      const st = p.connectionState; connectedRef.current = st === 'connected';
      setPeer(st === 'connected' ? 'connected' : st === 'failed' || st === 'disconnected' || st === 'closed' ? 'waiting' : 'connecting');
    };
    return p;
  }

  // Each side sends only its own microphone, so speaker attribution is exact.
  function startCapture(stream: MediaStream) {
    const ctx = new AudioContext(), src = ctx.createMediaStreamSource(new MediaStream(stream.getAudioTracks())), proc = ctx.createScriptProcessor(4096, 1, 1);
    proc.onaudioprocess = e => {
      if (!connectedRef.current || mutedRef.current) { buf.current = []; count.current = 0; return; }
      const part = new Float32Array(e.inputBuffer.getChannelData(0)); buf.current.push(part); count.current += part.length;
      if (count.current >= ctx.sampleRate * 8) {
        const all = new Float32Array(count.current); let o = 0; for (const b of buf.current) { all.set(b, o); o += b.length; }
        buf.current = []; count.current = 0;
        let energy = 0; for (let i = 0; i < all.length; i += 8) energy += all[i]! * all[i]!; if (Math.sqrt(energy / (all.length / 8)) < 0.01) return; // skip silence
        const when = new Date(Date.now() - 8000).toISOString();
        void transcribe({ data: { id, key: crypto.randomUUID(), audio: wav(all, ctx.sampleRate), when } }).catch(err => setError(err instanceof Error ? err.message : 'Speech could not be transcribed.'));
      }
    };
    const silent = ctx.createGain(); silent.gain.value = 0; src.connect(proc); proc.connect(silent); silent.connect(ctx.destination); void ctx.resume(); audio.current = { ctx, proc };
  }

  async function start() {
    setError(''); setBusy(true);
    try {
      const r = await join({ data: { id, consent: true } });
      const stream = await navigator.mediaDevices.getUserMedia({ audio: { echoCancellation: true, noiseSuppression: true }, video: { width: 1280, height: 720 } }).catch(() => navigator.mediaDevices.getUserMedia({ audio: true }));
      local.current = stream; setInfo(r); started.current = Date.now();
      requestAnimationFrame(() => { if (localVideo.current) localVideo.current.srcObject = stream; });
      startCapture(stream);
      const channel = supabase.channel(r.channel, { config: { broadcast: { self: false } } }); chan.current = channel;
      channel.on('broadcast', { event: 'signal' }, async ({ payload }) => {
        const s = payload as Signal; if (s.from === r.role) return;
        try {
          if (s.type === 'bye') { pc.current?.close(); pc.current = null; connectedRef.current = false; setPeer('waiting'); if (remoteVideo.current) remoteVideo.current.srcObject = null; return; }
          if (r.role === 'care-team' && (s.type === 'hello' || s.type === 'ready')) {
            const p = newPeer(r.role); const offer = await p.createOffer(); await p.setLocalDescription(offer); send({ type: 'offer', sdp: offer }, r.role); return;
          }
          if (r.role === 'caregiver' && s.type === 'hello') { send({ type: 'ready' }, r.role); return; }
          if (s.type === 'offer' && s.sdp) { const p = newPeer(r.role); await p.setRemoteDescription(s.sdp); for (const c of pendingIce.current.splice(0)) await p.addIceCandidate(c); const ans = await p.createAnswer(); await p.setLocalDescription(ans); send({ type: 'answer', sdp: ans }, r.role); return; }
          if (s.type === 'answer' && s.sdp && pc.current?.signalingState === 'have-local-offer') { await pc.current.setRemoteDescription(s.sdp); for (const c of pendingIce.current.splice(0)) await pc.current.addIceCandidate(c); return; }
          if (s.type === 'ice' && s.candidate) { if (pc.current?.remoteDescription) await pc.current.addIceCandidate(s.candidate); else pendingIce.current.push(s.candidate); }
        } catch { /* a later offer renegotiates */ }
      }).subscribe(st => { if (st === 'SUBSCRIBED') send({ type: 'hello' }, r.role); });
    } catch (e) { setError(e instanceof Error ? e.message : 'The appointment could not be joined.'); cleanup(); setInfo(null); }
    finally { setBusy(false); }
  }

  useEffect(() => {
    if (info?.role !== 'care-team' || ended) return;
    const t = setInterval(() => { void transcript({ data: { id } }).then(setLines).catch(() => undefined); }, 4000);
    return () => clearInterval(t);
  }, [info, ended, id]); // eslint-disable-line react-hooks/exhaustive-deps

  function toggleMic() { const m = !muted; local.current?.getAudioTracks().forEach(t => (t.enabled = !m)); mutedRef.current = m; setMuted(m); }
  function toggleCam() { const c = !camOff; local.current?.getVideoTracks().forEach(t => (t.enabled = !c)); setCamOff(c); }
  function leave() { cleanup(); onClose(); }
  async function endAndDocument() {
    setEnding(true); setError('');
    try { await new Promise(r => setTimeout(r, 1500)); cleanup(); setEnded(true); await finish({ data: { id } }); setCard(await draft({ data: { appointmentId: id } })); }
    catch (e) { setError(e instanceof Error ? e.message : 'The summary could not be prepared.'); }
    finally { setEnding(false); }
  }

  if (ended) return <section className="vroom vroom-done">
    <header className="vroom-top"><Button variant="ghost" onClick={onClose}><ArrowLeft />Appointments</Button><h2><FileText />Consultation summary</h2></header>
    {ending ? <div className="vroom-wait"><Loader2 className="spin" /><p>Lekha is organising the conversation into a care card…</p></div>
      : card ? <><p className="vroom-note">Draft only — review, edit and approve it in Lekha before it reaches the Sutra journey.</p><TopicCards card={card} /></>
      : <p className="vroom-note">{error ? '' : 'Consultation ended.'}</p>}
    {error && <p role="alert" className="svara-error">{error}</p>}
  </section>;

  if (!info) return <section className="vroom">
    <header className="vroom-top"><Button variant="ghost" onClick={onClose}><ArrowLeft />Appointments</Button></header>
    <div className="vroom-lobby">
      <span className="vroom-badge"><ShieldCheck />Private 1-on-1 consultation</span>
      <h3>Join your online appointment</h3>
      <p>Video goes directly between the two of you and is never recorded. With both participants’ consent, each person’s spoken words are transcribed and labelled so the care team can review a documentation draft.</p>
      <label><input type="checkbox" checked={consent} onChange={e => setConsent(e.target.checked)} />I consent to transcription for clinician-reviewed care documentation.</label>
      <Button disabled={!consent || busy} onClick={() => void start()}>{busy ? <Loader2 className="spin" /> : <Video />}Join appointment</Button>
      {error && <p role="alert" className="svara-error">{error}</p>}
    </div>
  </section>;

  const team = info.role === 'care-team';
  return <section className={`vroom ${team ? 'has-panel' : ''}`}>
    <header className="vroom-top"><div><h2>{info.babyName} · {info.reason}</h2><p>{peer === 'connected' ? `Connected with ${info.peerName}` : peer === 'connecting' ? 'Connecting…' : `Waiting for ${info.peerName} to join…`}</p></div><span className={`vroom-dot is-${peer}`}>{peer === 'connected' ? 'Live' : 'Waiting'}</span></header>
    <div className="vroom-body">
      <div className="vroom-stage">
        <video ref={remoteVideo} autoPlay playsInline className="vroom-remote" />
        {peer !== 'connected' && <div className="vroom-empty"><Loader2 className="spin" /><span>{info.peerName} will appear here</span></div>}
        <span className="vroom-tag">{info.peerName}</span>
        <div className="vroom-self"><video ref={localVideo} autoPlay playsInline muted />{camOff && <span>Camera off</span>}<em>You</em></div>
        <div className="vroom-dock">
          <Button variant="ghost" aria-label={muted ? 'Unmute' : 'Mute'} className={muted ? 'is-off' : ''} onClick={toggleMic}>{muted ? <MicOff /> : <Mic />}</Button>
          <Button variant="ghost" aria-label={camOff ? 'Camera on' : 'Camera off'} className={camOff ? 'is-off' : ''} onClick={toggleCam}>{camOff ? <VideoOff /> : <Video />}</Button>
          {team && <Button variant="ghost" className="vroom-doc" disabled={ending} onClick={() => void endAndDocument()}><FileText />End & summarise</Button>}
          <Button variant="ghost" aria-label="Leave" className="vroom-leave" onClick={leave}><PhoneOff /></Button>
        </div>
      </div>
      {team && <aside className="vroom-panel"><h3>Live transcript</h3><p>Labelled by each participant’s own microphone.</p>
        <div className="vroom-lines">{lines.length ? lines.map(l => <div key={l.event_key} className={`vroom-line ${l.speaker === 'Care Team' ? 'is-me' : ''}`}><b>{l.speaker}</b><span>{l.content}</span></div>) : <p className="vroom-muted">Transcript lines appear here as you both speak.</p>}</div>
      </aside>}
    </div>
    {error && <p role="alert" className="svara-error">{error}</p>}
  </section>;
}
