import { useEffect, useMemo, useRef, useState } from 'react';
import { useServerFn } from '@tanstack/react-start';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { ArrowUp, CalendarDays, Check, FileText, Mic, Paperclip, Pin, Square, Video, X, MapPin, Activity, Clock } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { getCareData, getChat, sendChat, getChatFile, updateAppointment } from '@/lib/care.functions';
import { parseCard } from '@/lib/care-card';
import { DocumentViewer } from '@/components/care/document-viewer';
import { LekhaDocument } from '@/components/care/lekha-document';
import { OnlineMeeting } from '@/components/care/online-meeting';
import { HaloNotification } from '@/components/care/halo-notification';
import type { DemoRole } from '@/lib/care-domain';
import { useNexconn } from './use-nexconn';

type Data = Awaited<ReturnType<typeof getCareData>>;
type Appt = Data['appointments'][number];
const time = (v: string) => new Date(v).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit', timeZone: 'Asia/Kolkata' });
const day = (v: string) => new Date(v).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric', timeZone: 'Asia/Kolkata' });
const when = (a: Appt) => new Date(a.starts_at).toLocaleString('en-IN', { weekday: 'short', day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit', timeZone: 'Asia/Kolkata' });
const isOnline = (a: Appt) => (a.location as Record<string, unknown> | null)?.['mode'] === 'online';
const toBase64 = (b: Blob) => new Promise<string>((res, rej) => { const r = new FileReader(); r.onload = () => res(String(r.result).split(',')[1] ?? ''); r.onerror = rej; r.readAsDataURL(b); });

/** Upcoming, not-closed appointment pinned at the top of the conversation. */
export function pinnedAppointment(list: Appt[], babyId: string, now = Date.now()) {
  return list.filter(a => a.baby_id === babyId && !['Completed', 'Cancelled'].includes(a.status) && new Date(a.starts_at).getTime() > now - 2 * 3600_000).sort((a, b) => a.starts_at.localeCompare(b.starts_at))[0];
}

export function MiniAppointment({ appt, role, onJoin, onCancel, onDecide, onRequest, busy }: { appt: Appt; role: DemoRole; busy: boolean; onJoin: () => void; onCancel: () => void; onDecide: (ok: boolean) => void; onRequest: (d: string, t: string) => void }) {
  const [asking, setAsking] = useState(false), [d, setD] = useState(''), [t, setT] = useState('');
  const req = appt.reschedule as { date?: string; time?: string } | null;
  const closed = ['Completed', 'Cancelled'].includes(appt.status);
  return <div className={`chat-appt ${closed ? 'is-closed' : ''}`}>
    <div className="chat-appt-date"><span>{new Date(appt.starts_at).toLocaleDateString('en-IN', { month: 'short', timeZone: 'Asia/Kolkata' })}</span><strong>{new Date(appt.starts_at).toLocaleDateString('en-IN', { day: '2-digit', timeZone: 'Asia/Kolkata' })}</strong></div>
    <div className="chat-appt-body"><strong>{appt.reason}</strong><small>{isOnline(appt) ? <Video size={12} /> : <MapPin size={12} />}{isOnline(appt) ? 'Online video' : 'In-person'} · {when(appt)}</small><em>{appt.status}{appt.status === 'Reschedule requested' && req?.date ? ` · asks ${req.date} ${req.time}` : ''}</em>
      {asking && <div className="chat-appt-ask"><input type="date" aria-label="Preferred date" value={d} onChange={e => setD(e.target.value)} /><input type="time" aria-label="Preferred time" value={t} onChange={e => setT(e.target.value)} /><Button size="sm" disabled={!d || !t || busy} onClick={() => { onRequest(d, t); setAsking(false); }}>Send</Button></div>}
    </div>
    {!closed && <div className="chat-appt-actions">
      {isOnline(appt) && <Button size="sm" onClick={onJoin}><Video />Join</Button>}
      {role === 'care-team' && appt.status === 'Reschedule requested' && <><Button size="sm" variant="outline" disabled={busy} onClick={() => onDecide(true)}><Check />Approve</Button><Button size="sm" variant="ghost" disabled={busy} onClick={() => onDecide(false)}>Decline</Button></>}
      {role === 'care-team' && <Button size="sm" variant="ghost" disabled={busy} onClick={onCancel}><X />Cancel</Button>}
      {role === 'caregiver' && appt.status !== 'Reschedule requested' && <Button size="sm" variant="ghost" onClick={() => setAsking(v => !v)}><Clock />New time</Button>}
    </div>}
  </div>;
}

export function Converse({ data, role, babyId, onRead }: { data: Data; role: DemoRole; babyId: string; onRead: () => void }) {
  const fetchChat = useServerFn(getChat), send = useServerFn(sendChat), file = useServerFn(getChatFile), change = useServerFn(updateAppointment);
  const qc = useQueryClient();
  const baby = data.babies.find(b => b.id === babyId);
  const chat = useQuery({ queryKey: ['chat', babyId], queryFn: () => fetchChat({ data: { babyId } }), refetchInterval: 5000, enabled: !!babyId });
  const { status, signal } = useNexconn(() => { void chat.refetch(); onRead(); });
  const [draft, setDraft] = useState(''), [busy, setBusy] = useState(false), [notice, setNotice] = useState(''), [meeting, setMeeting] = useState<string | null>(null), [doc, setDoc] = useState<string | null>(null);
  const [rec, setRec] = useState<MediaRecorder | null>(null), [audio, setAudio] = useState<Record<string, string>>({});
  const list = useRef<HTMLDivElement>(null), fileInput = useRef<HTMLInputElement>(null);
  const msgs = chat.data?.messages ?? [];
  useEffect(() => { list.current?.scrollTo({ top: list.current.scrollHeight }); }, [msgs.length, babyId]);
  useEffect(() => { if (chat.dataUpdatedAt) onRead(); }, [chat.dataUpdatedAt]);
  const pinned = useMemo(() => pinnedAppointment(data.appointments, babyId), [data.appointments, babyId]);
  const me = role === 'care-team' ? 'care-team' : 'caregiver';

  async function post(kind: 'text' | 'voice' | 'file', body: string, f?: { name: string; mime: string; data: string }) {
    if (busy) return; setBusy(true);
    try { await send({ data: { babyId, kind, body, ...(f ? { file: f } : {}) } }); if (kind === 'text') setDraft(''); await chat.refetch(); if (chat.data?.peer) void signal(chat.data.peer, JSON.stringify({ nv: 'msg', babyId })); }
    catch (e) { setNotice(e instanceof Error ? e.message : 'Message not sent.'); } finally { setBusy(false); }
  }
  async function attach(f: File) { if (f.size > 4_000_000) { setNotice('Files up to 4 MB can be shared.'); return; } await post('file', f.name, { name: f.name, mime: f.type, data: await toBase64(f) }); }
  async function toggleMic() {
    if (rec) { rec.stop(); setRec(null); return; }
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true }); const r = new MediaRecorder(stream); const parts: Blob[] = [];
      r.ondataavailable = e => parts.push(e.data);
      r.onstop = () => { stream.getTracks().forEach(t => t.stop()); const blob = new Blob(parts, { type: r.mimeType || 'audio/webm' }); if (blob.size < 800) return; void toBase64(blob).then(d => post('voice', 'Voice message', { name: 'voice-message.webm', mime: blob.type, data: d })); };
      r.start(); setRec(r);
    } catch { setNotice('Microphone permission is needed for voice messages.'); }
  }
  async function openFile(id: string, play: boolean) {
    try { const f = await file({ data: { id } }); const url = `data:${f.mime};base64,${f.data}`; if (play) setAudio(a => ({ ...a, [id]: url })); else { const a = document.createElement('a'); a.href = url; a.download = f.name; a.click(); } } catch (e) { setNotice(e instanceof Error ? e.message : 'File unavailable.'); }
  }
  async function act(id: string, s: 'Cancelled' | 'Reschedule approved' | 'Reschedule declined' | 'Reschedule requested', extra: { preferredDate?: string; preferredTime?: string } = {}) {
    setBusy(true); try { await change({ data: { id, status: s, ...extra } }); await qc.invalidateQueries({ queryKey: ['care-data'] }); await chat.refetch(); if (chat.data?.peer) void signal(chat.data.peer, JSON.stringify({ nv: 'appt', babyId })); } catch (e) { setNotice(e instanceof Error ? e.message : 'Please try again.'); } finally { setBusy(false); }
  }
  const apptCard = (a: Appt) => <MiniAppointment appt={a} role={role} busy={busy} onJoin={() => setMeeting(a.id)} onCancel={() => void act(a.id, 'Cancelled')} onDecide={ok => void act(a.id, ok ? 'Reschedule approved' : 'Reschedule declined')} onRequest={(d, t) => void act(a.id, 'Reschedule requested', { preferredDate: d, preferredTime: t })} />;
  const card = doc ? data.cards.find(c => c.id === doc) : undefined; const parsed = card ? parseCard(card.summary_text) : null;
  if (!baby) return <div className="converse-empty"><p>Select a caregiver to start conversing.</p></div>;
  let lastDay = '';
  return <section className="converse" aria-label={`Conversation with ${role === 'care-team' ? baby.caregiver_name : 'your care team'}`}>
    <header className="converse-head"><span className="converse-avatar">{(role === 'care-team' ? baby.baby_name : 'C').charAt(0)}</span><div><strong>{role === 'care-team' ? `${baby.baby_name} · ${baby.caregiver_name}` : 'Dr. Ananya Rao · Care Team'}</strong><small><i className={`converse-dot is-${status}`} />{status === 'live' ? 'Live chat connected' : status === 'connecting' ? 'Connecting…' : 'Syncing every few seconds'}</small></div></header>
    {pinned && <div className="converse-pin"><span className="converse-pin-label"><Pin size={12} />Pinned</span>{apptCard(pinned)}</div>}
    <div className="converse-list" ref={list}>
      {!msgs.length && !chat.isLoading && <p className="converse-hint">Say hello. Messages, voice notes, documents, appointments and Svara Health Cards appear here.</p>}
      {msgs.map(m => {
        const d = day(m.created_at); const sep = d !== lastDay ? (lastDay = d) : null; const mine = m.sender === me;
        const appt = m.kind === 'appointment' ? data.appointments.find(a => a.id === m.ref_id) : undefined;
        return <div key={m.id}>{sep && <div className="converse-day"><span>{sep}</span></div>}
          {m.kind === 'appointment' ? <div className="converse-system"><span><CalendarDays size={13} />{m.body}</span>{appt && m.sender === 'system' && apptCard(appt)}</div>
            : <div className={`converse-bubble ${mine ? 'is-mine' : 'is-theirs'}`}>
              {m.kind === 'svara_card' ? <button type="button" className="converse-doc" onClick={() => setDoc(m.ref_id)}><Activity /><span><strong>Svara Health Card</strong><small>{m.body}</small></span><FileText /></button>
                : m.kind === 'voice' && m.file_id ? (audio[m.file_id] ? <audio controls autoPlay src={audio[m.file_id]} /> : <button type="button" className="converse-voice" onClick={() => void openFile(m.file_id!, true)}><Mic size={14} />Play voice message</button>)
                  : m.kind === 'file' && m.file_id ? <button type="button" className="converse-doc" onClick={() => void openFile(m.file_id!, false)}><FileText /><span><strong>{m.file?.name ?? m.body}</strong><small>Tap to download</small></span></button>
                    : <p>{m.body}</p>}
              <time>{time(m.created_at)}{mine && <Check size={11} className={(role === 'care-team' ? m.read_by_caregiver_at : m.read_by_team_at) ? 'is-read' : ''} />}</time>
            </div>}
        </div>;
      })}
    </div>
    <form className="converse-composer" onSubmit={e => { e.preventDefault(); if (draft.trim()) void post('text', draft); }}>
      <input ref={fileInput} type="file" hidden accept="image/*,.pdf,.doc,.docx,.txt" onChange={e => { const f = e.target.files?.[0]; e.target.value = ''; if (f) void attach(f); }} />
      <Button type="button" variant="ghost" size="icon-sm" aria-label="Attach document" disabled={busy} onClick={() => fileInput.current?.click()}><Paperclip /></Button>
      <textarea rows={1} value={draft} placeholder={rec ? 'Recording voice message…' : 'Type a message'} aria-label="Message" disabled={!!rec} onChange={e => setDraft(e.target.value)} onKeyDown={e => { if (e.key === 'Enter' && !e.shiftKey && !e.nativeEvent.isComposing) { e.preventDefault(); if (draft.trim()) void post('text', draft); } }} />
      {draft.trim() ? <Button type="submit" size="icon-sm" aria-label="Send" disabled={busy}><ArrowUp /></Button> : <Button type="button" size="icon-sm" variant={rec ? 'default' : 'ghost'} aria-label={rec ? 'Stop and send voice message' : 'Record voice message'} disabled={busy} onClick={() => void toggleMic()}>{rec ? <Square /> : <Mic />}</Button>}
    </form>
    {notice && <HaloNotification message={notice} onClose={() => setNotice('')} />}
    {meeting && <OnlineMeeting id={meeting} onClose={() => { setMeeting(null); void qc.invalidateQueries(); }} />}
    {card && <DocumentViewer title="Svara Health Card" onClose={() => setDoc(null)}>{parsed ? <LekhaDocument meta={{ kind: 'svara', babyName: baby.baby_name, caregiverName: baby.caregiver_name, reason: 'Svara voice check-in', when: day(card.created_at), clinician: 'Dr. Ananya Rao' }} card={parsed} approved={card.reviewed} /> : <p className="p-6">{card.quote}</p>}</DocumentViewer>}
  </section>;
}
