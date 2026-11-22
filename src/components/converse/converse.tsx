import { useEffect, useMemo, useRef, useState } from 'react';
import { useServerFn } from '@tanstack/react-start';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { ArrowUp, CalendarDays, Check, CheckCheck, ChevronLeft, ChevronRight, FileText, Mic, Paperclip, Pin, Square, Video, X, MapPin, Activity, Clock, Phone, Copy, Pencil, Trash2, Smile, History, Plus, Download, ZoomIn, ZoomOut, SmilePlus, Reply, Camera, Image as ImageIcon, Headphones, Sparkles } from 'lucide-react';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { useVoiceNote } from './use-voice-note';
import { AvatarPreview, type AvatarPhoto } from './avatar-preview';
import { Button } from '@/components/ui/button';
import { getCareData, getChat, sendChat, getChatFile, updateAppointment, editChat, deleteChat, reactChat, approveSvaraCard } from '@/lib/care.functions';
import { parseCard, cardText } from '@/lib/care-card';
import { DocumentActions } from '@/components/care/document-actions';
import { CARE_TEAM_DOCTOR, isLegacySvaraBody, svaraAskSutraQuestion, consultAskSutraQuestion } from '@/lib/chat-messages';
import { OnlineMeeting } from '@/components/care/online-meeting';
import { HaloNotification } from '@/components/care/halo-notification';
import type { DemoRole } from '@/lib/care-domain';
import { useNexconn } from './use-nexconn';
import { ChatHistory, type AskSutraDoc } from './chat-history';
import { lockScroll } from '@/lib/scroll-lock';

type Data = Awaited<ReturnType<typeof getCareData>>;
type Appt = Data['appointments'][number];
const time = (v: string) => new Date(v).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit', timeZone: 'Asia/Kolkata' });
const day = (v: string) => new Date(v).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric', timeZone: 'Asia/Kolkata' });
const when = (a: Appt) => new Date(a.starts_at).toLocaleString('en-IN', { weekday: 'short', day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit', timeZone: 'Asia/Kolkata' });
const isOnline = (a: Appt) => (a.location as Record<string, unknown> | null)?.['mode'] === 'online';
const toBase64 = (b: Blob) => new Promise<string>((res, rej) => { const r = new FileReader(); r.onload = () => res(String(r.result).split(',')[1] ?? ''); r.onerror = rej; r.readAsDataURL(b); });

/** Upcoming, not-closed appointment pinned at the top of the conversation. */
export function pinnedAppointment(list: Appt[], babyId: string, now = Date.now()) {
  return pinnedAppointments(list, babyId, now)[0];
}
/** Every upcoming open appointment, soonest first; the pinned bar shows one and scrolls through the rest. */
export function pinnedAppointments(list: Appt[], babyId: string, now = Date.now()) {
  return list.filter(a => a.baby_id === babyId && !['Completed', 'Cancelled'].includes(a.status) && new Date(a.starts_at).getTime() > now - 2 * 3600_000).sort((a, b) => a.starts_at.localeCompare(b.starts_at));
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

export const QUICK_REACTIONS = ['❤️', '👍', '🙏', '😊', '😮'];
const EMOJIS = ['😀','😊','🙂','😍','🥰','😘','😂','🤗','🙏','👍','👏','🙌','💪','👌','✌️','🤝','❤️','🩷','💕','💖','💗','🌸','🌷','🌼','✨','⭐','🎉','🍼','👶','🧸','😴','😮','😢','😟','🤒','🌡️','💊','🩺','🏥','📅','⏰','✅','❓','🙂‍↕️','😌','🤍'];

function EmojiGrid({ onPick }: { onPick: (e: string) => void }) {
  return <div className="converse-emoji-grid" role="listbox" aria-label="Emojis">{EMOJIS.map(e => <button key={e} type="button" role="option" aria-selected={false} onClick={() => onPick(e)}>{e}</button>)}</div>;
}

/** Full-screen image viewer with zoom in/out and download. */
function ImageViewer({ src, name, onClose }: { src: string; name: string; onClose: () => void }) {
  const [zoom, setZoom] = useState(1);
  useEffect(() => { const unlock = lockScroll(); const k = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose(); }; window.addEventListener('keydown', k); return () => { unlock(); window.removeEventListener('keydown', k); }; }, [onClose]);
  const download = () => { const a = document.createElement('a'); a.href = src; a.download = name; a.click(); };
  return <div className="converse-lightbox" role="dialog" aria-modal="true" aria-label={name}>
    <div className="converse-lightbox-bar"><span>{name}</span><div>
      <Button variant="ghost" size="icon" aria-label="Zoom out" disabled={zoom <= 0.5} onClick={() => setZoom(z => Math.max(0.5, z - 0.25))}><ZoomOut /></Button>
      <span className="converse-zoom">{Math.round(zoom * 100)}%</span>
      <Button variant="ghost" size="icon" aria-label="Zoom in" disabled={zoom >= 4} onClick={() => setZoom(z => Math.min(4, z + 0.25))}><ZoomIn /></Button>
      <Button variant="ghost" size="icon" aria-label="Download image" onClick={download}><Download /></Button>
      <Button variant="ghost" size="icon" aria-label="Close image" onClick={onClose}><X /></Button>
    </div></div>
    <div className="converse-lightbox-stage" onClick={onClose}><img src={src} alt={name} style={{ transform: `scale(${zoom})` }} onClick={e => e.stopPropagation()} onDoubleClick={() => setZoom(z => z === 1 ? 2 : 1)} /></div>
  </div>;
}

export function Converse({ data, role, babyId, onRead, onAskSutra, onHistoryChange }: { data: Data; role: DemoRole; babyId: string; onRead: () => void; onAskSutra?: (d: AskSutraDoc) => void; onHistoryChange?: (open: boolean) => void }) {
  const editFn = useServerFn(editChat), delFn = useServerFn(deleteChat), reactFn = useServerFn(reactChat), approveFn = useServerFn(approveSvaraCard);
  const fetchChat = useServerFn(getChat), send = useServerFn(sendChat), file = useServerFn(getChatFile), change = useServerFn(updateAppointment);
  const qc = useQueryClient();
  const baby = data.babies.find(b => b.id === babyId);
  const chat = useQuery({ queryKey: ['chat', babyId], queryFn: () => fetchChat({ data: { babyId } }), refetchInterval: 5000, enabled: !!babyId });
  const { status, signal } = useNexconn(() => { void chat.refetch(); onRead(); });
  const [draft, setDraft] = useState(''), [busy, setBusy] = useState(false), [notice, setNotice] = useState(''), [meeting, setMeeting] = useState<string | null>(null);
  const [audio, setAudio] = useState<Record<string, string>>({}), [images, setImages] = useState<Record<string, string>>({});
  const [pending, setPending] = useState<File | null>(null), [pendingUrl, setPendingUrl] = useState(''), [editing, setEditing] = useState<string | null>(null), [menu, setMenu] = useState<string | null>(null);
  const [sending, setSending] = useState<{ id: string; body: string }[]>([]), [viewer, setViewer] = useState<{ src: string; name: string } | null>(null), [history, setHistory] = useState(false), [pinIndex, setPinIndex] = useState(0), [moreFor, setMoreFor] = useState<string | null>(null);
  const [replyTo, setReplyTo] = useState<string | null>(null), [flash, setFlash] = useState<string | null>(null), [divider, setDivider] = useState<string | null | undefined>(undefined), [attachOpen, setAttachOpen] = useState(false);
  const docInput = useRef<HTMLInputElement>(null), mediaInput = useRef<HTMLInputElement>(null), audioInput = useRef<HTMLInputElement>(null), camInput = useRef<HTMLInputElement>(null);
  const [avatar, setAvatar] = useState<AvatarPhoto | null>(null);
  const voice = useVoiceNote(f => choose(f), setNotice);
  const list = useRef<HTMLDivElement>(null), textRef = useRef<HTMLTextAreaElement>(null);
  useEffect(() => { const el = textRef.current; if (!el) return; el.style.height = '0px'; const css = getComputedStyle(el); const max = parseFloat(css.lineHeight) * 3 + parseFloat(css.paddingTop) + parseFloat(css.paddingBottom); el.style.height = `${Math.min(el.scrollHeight, max)}px`; }, [draft]);
  const all = useMemo(() => chat.data?.messages ?? [], [chat.data]);
  const msgs = useMemo(() => all.filter(m => m.kind !== 'reaction'), [all]);
  const reactions = useMemo(() => { const r: Record<string, { emoji: string; mine: boolean; n: number }[]> = {}; for (const m of all) if (m.kind === 'reaction' && m.ref_id) { const l = r[m.ref_id] ??= []; const e = l.find(x => x.emoji === m.body); const mine = m.sender === (role === 'care-team' ? 'care-team' : 'caregiver'); if (e) { e.n++; e.mine ||= mine; } else l.push({ emoji: m.body, mine, n: 1 }); } return r; }, [all, role]);
  useEffect(() => { if (divider) return; list.current?.scrollTo({ top: list.current.scrollHeight }); }, [msgs.length, sending.length, babyId, history]);
  useEffect(() => { if (chat.dataUpdatedAt) onRead(); }, [chat.dataUpdatedAt]);
  useEffect(() => { onHistoryChange?.(history); }, [history]);
  useEffect(() => () => onHistoryChange?.(false), []);
  // "New messages" divider: taken from the first load only, then fades a few seconds after being seen.
  useEffect(() => { if (divider !== undefined || !chat.data) return; const id = chat.data.firstUnread ?? null; setDivider(id); if (id) { requestAnimationFrame(() => list.current?.querySelector(`[data-mid="${id}"]`)?.scrollIntoView({ block: 'center' })); setTimeout(() => setDivider(null), 6000); } }, [chat.data]);
  function jumpTo(id: string) { const el = list.current?.querySelector(`[data-mid="${id}"]`); if (!el) { setNotice('That message is no longer available.'); return; } el.scrollIntoView({ behavior: 'smooth', block: 'center' }); setFlash(null); requestAnimationFrame(() => setFlash(id)); setTimeout(() => setFlash(f => f === id ? null : f), 1700); }
  const preview = (m: { kind: string; body: string; file?: { name: string } | null }) => m.kind === 'text' ? m.body : m.kind === 'voice' ? 'Voice message' : m.kind === 'svara_card' ? 'Svara check-in' : m.file?.name ?? m.body ?? 'Attachment';
  const who = (sender: string) => sender === me ? 'You' : sender === 'caregiver' ? (baby?.caregiver_name ?? 'Caregiver') : 'Care Team';
  useEffect(() => { if (!pending || !(pending.type.startsWith('image/') || pending.type.startsWith('audio/'))) { setPendingUrl(''); return; } const u = URL.createObjectURL(pending); setPendingUrl(u); return () => URL.revokeObjectURL(u); }, [pending]);
  // Images preview inline: load each image file once.
  useEffect(() => { for (const m of msgs) if (m.kind === 'file' && m.file_id && m.file?.mime?.startsWith('image/') && !(m.file_id in images)) { const id = m.file_id; setImages(x => ({ ...x, [id]: '' })); void file({ data: { id } }).then(f => setImages(x => ({ ...x, [id]: `data:${f.mime};base64,${f.data}` }))).catch(() => undefined); } }, [msgs]);
  // A Svara card can arrive by chat before care data knows it: refresh care data once for each unknown card.
  const askedCards = useRef(new Set<string>());
  useEffect(() => { const missing = msgs.filter(m => m.kind === 'svara_card' && m.ref_id && !data.cards.some(c => c.id === m.ref_id) && !askedCards.current.has(m.ref_id)); if (!missing.length) return; missing.forEach(m => m.ref_id && askedCards.current.add(m.ref_id)); void qc.invalidateQueries({ queryKey: ['care-data'] }); }, [msgs, data.cards]);
  const pins = useMemo(() => pinnedAppointments(data.appointments, babyId), [data.appointments, babyId]);
  const pin = pins[Math.min(pinIndex, Math.max(0, pins.length - 1))];
  const me = role === 'care-team' ? 'care-team' : 'caregiver';

  async function post(kind: 'text' | 'voice' | 'file', body: string, f?: { name: string; mime: string; data: string }) {
    if (busy) return false; setBusy(true);
    const tmp = { id: crypto.randomUUID(), body: kind === 'text' ? body : f?.name ?? body };
    setSending(s => [...s, tmp]);
    const rt = replyTo; setReplyTo(null); try { await send({ data: { babyId, kind, body, ...(f ? { file: f } : {}), ...(rt ? { replyTo: rt } : {}) } }); await chat.refetch(); if (chat.data?.peer) void signal(chat.data.peer, JSON.stringify({ nv: 'msg', babyId })); return true; }
    catch (e) { if (rt) setReplyTo(rt); setNotice(e instanceof Error ? e.message : 'Message not sent.'); return false; } finally { setSending(s => s.filter(x => x.id !== tmp.id)); setBusy(false); }
  }
  function choose(f: File) { if (f.size > 4_000_000) { setNotice('Files up to 4 MB can be shared.'); return; } setPending(f); }
  async function submit() {
    if (busy || voice.recording || voice.starting) return;
    const text = draft.trim();
    if (editing) { if (!text) return; setBusy(true); try { await editFn({ data: { id: editing, body: text } }); setEditing(null); setDraft(''); await chat.refetch(); } catch (e) { setNotice(e instanceof Error ? e.message : 'Could not edit.'); } finally { setBusy(false); } return; }
    if (pending) { const f = pending; const ok = await post(f.type.startsWith('audio/') ? 'voice' : 'file', f.type.startsWith('audio/') ? 'Voice message' : f.name, { name: f.name, mime: f.type, data: await toBase64(f) }); if (!ok) return; setPending(null); }
    if (text) { setDraft(''); if (!await post('text', text)) setDraft(text); }
  }
  async function approveCard(id: string) { if (busy) return; setBusy(true); try { await approveFn({ data: { id } }); await qc.invalidateQueries({ queryKey: ['care-data'] }); await chat.refetch(); if (chat.data?.peer) void signal(chat.data.peer, JSON.stringify({ nv: 'msg', babyId })); } catch (e) { setNotice(e instanceof Error ? e.message : 'Could not approve this check-in.'); } finally { setBusy(false); } }
  async function react(id: string, emoji: string) { setMenu(null); setMoreFor(null); try { await reactFn({ data: { id, emoji } }); await chat.refetch(); if (chat.data?.peer) void signal(chat.data.peer, JSON.stringify({ nv: 'msg', babyId })); } catch (e) { setNotice(e instanceof Error ? e.message : 'Could not react.'); } }
  function insertEmoji(e: string) { const el = textRef.current; const at = el?.selectionStart ?? draft.length; setDraft(d => d.slice(0, at) + e + d.slice(at)); requestAnimationFrame(() => { el?.focus(); el?.setSelectionRange(at + e.length, at + e.length); }); }
  async function remove(id: string) { setMenu(null); setBusy(true); try { await delFn({ data: { id } }); await chat.refetch(); } catch (e) { setNotice(e instanceof Error ? e.message : 'Could not delete.'); } finally { setBusy(false); } }
  async function openFile(id: string, play: boolean) {
    try { const f = await file({ data: { id } }); const url = `data:${f.mime};base64,${f.data}`; if (play) setAudio(a => ({ ...a, [id]: url })); else { const a = document.createElement('a'); a.href = url; a.download = f.name; a.click(); } } catch (e) { setNotice(e instanceof Error ? e.message : 'File unavailable.'); }
  }
  async function act(id: string, s: 'Cancelled' | 'Reschedule approved' | 'Reschedule declined' | 'Reschedule requested', extra: { preferredDate?: string; preferredTime?: string } = {}) {
    setBusy(true); try { await change({ data: { id, status: s, ...extra } }); await qc.invalidateQueries({ queryKey: ['care-data'] }); await chat.refetch(); if (chat.data?.peer) void signal(chat.data.peer, JSON.stringify({ nv: 'appt', babyId })); } catch (e) { setNotice(e instanceof Error ? e.message : 'Please try again.'); } finally { setBusy(false); }
  }
  const apptCard = (a: Appt) => <MiniAppointment appt={a} role={role} busy={busy} onJoin={() => setMeeting(a.id)} onCancel={() => void act(a.id, 'Cancelled')} onDecide={ok => void act(a.id, ok ? 'Reschedule approved' : 'Reschedule declined')} onRequest={(d, t) => void act(a.id, 'Reschedule requested', { preferredDate: d, preferredTime: t })} />;
  if (!baby) return <div className="converse-empty"><p>Select a caregiver to start conversing.</p></div>;
  if (history) return <ChatHistory data={data} role={role} babyId={babyId} onBack={() => setHistory(false)} onAsk={d => { setHistory(false); onAskSutra?.(d); }} />;
  let lastDay = '';
  const st = data.settings as Record<string, string>;
  const calls: [string, string][] = role === 'care-team' ? [[`Call ${baby.caregiver_name}`, (baby.plan as Record<string, string>)?.['mobile'] ?? '']] : [['Care Team', st['careTeamContact'] ?? ''], ['Hospital Emergency', st['emergencyContact'] ?? ''], ['Ambulance', st['ambulanceNumber'] ?? ''], ['After-hours', st['afterHoursContact'] ?? '']];
  const okCalls = calls.filter(([, n]) => n);
  return <section className="converse" aria-label={`Conversation with ${role === 'care-team' ? baby.caregiver_name : 'your care team'}`}>
    <header className="converse-head">{(() => { const ph = role === 'care-team' ? ((data.settings as Record<string, unknown>)['caregiverPhotos'] as Record<string, string> | undefined)?.[baby.id] : (data.settings as Record<string, string>)['teamPhoto']; return ph ? <Button variant="ghost" size="icon" className="avatar-trigger" aria-label="View profile photo" onClick={() => setAvatar({ src: ph, name: role === 'care-team' ? baby.caregiver_name : 'Dr. Ananya Rao' })}><img className="converse-avatar converse-avatar-img" src={ph} alt="" /></Button> : <span className="converse-avatar">{(role === 'care-team' ? baby.baby_name : 'C').charAt(0)}</span>; })()}<div className="converse-head-meta"><strong>{role === 'care-team' ? `${baby.baby_name} · ${baby.caregiver_name}` : 'Dr. Ananya Rao · Care Team'}</strong><small><i className={`converse-dot is-${status}`} />{status === 'live' ? 'Live chat connected' : status === 'connecting' ? 'Connecting…' : 'Syncing every few seconds'}</small></div>
      {role === 'care-team' ? (okCalls[0] ? <Button asChild variant="ghost" size="icon" className="converse-call"><a href={'tel:' + okCalls[0][1].replace(/[^\d+]/g, '')} aria-label={okCalls[0][0]} title={okCalls[0][0]}><Phone /></a></Button> : <Button variant="ghost" size="icon" className="converse-call" aria-label="No phone number saved" title="No phone number saved yet" disabled><Phone /></Button>) : <Popover><PopoverTrigger asChild><Button variant="ghost" size="icon" className="converse-call" aria-label="Call options"><Phone /></Button></PopoverTrigger><PopoverContent align="end" className="converse-call-menu">{okCalls.length ? okCalls.map(([l, n]) => <a key={l} href={'tel:' + n.replace(/[^\d+]/g, '')}><Phone size={14} /><span><strong>{l}</strong><small>{n}</small></span></a>) : <p>No phone number saved yet.</p>}</PopoverContent></Popover>}
      <Button variant="ghost" size="icon" className="converse-call" aria-label="History" title="Past appointments and Svara check-ins" onClick={() => setHistory(true)}><History /></Button>
    </header>
    {pin && <div className="converse-pin"><span className="converse-pin-label"><Pin size={12} />Pinned{pins.length > 1 ? ` ${pins.indexOf(pin) + 1}/${pins.length}` : ''}</span>
      {pins.length > 1 && <Button variant="ghost" size="icon-sm" aria-label="Previous appointment" disabled={pins.indexOf(pin) === 0} onClick={() => setPinIndex(pins.indexOf(pin) - 1)}><ChevronLeft /></Button>}
      <div className="converse-pin-slot">{apptCard(pin)}</div>
      {pins.length > 1 && <Button variant="ghost" size="icon-sm" aria-label="Next appointment" disabled={pins.indexOf(pin) === pins.length - 1} onClick={() => setPinIndex(pins.indexOf(pin) + 1)}><ChevronRight /></Button>}
    </div>}
    <div className="converse-list" ref={list}>
      {!msgs.length && !chat.isLoading && !sending.length && <p className="converse-hint">Say hello. Messages, voice notes, photos, documents, appointments and Svara Health Cards appear here.</p>}
      {msgs.map(m => {
        const d = day(m.created_at); const sep = d !== lastDay ? (lastDay = d) : null; const mine = m.sender === me;
        const appt = m.kind === 'appointment' ? data.appointments.find(a => a.id === m.ref_id) : undefined;
        const isImg = m.kind === 'file' && !!m.file_id && !!m.file?.mime?.startsWith('image/'); const img = isImg ? images[m.file_id ?? ''] : undefined;
        const read = (role === 'care-team' ? m.read_by_caregiver_at : m.read_by_team_at);
        const rx = reactions[m.id];
        const reactable = ['text', 'voice', 'file', 'svara_card'].includes(m.kind);
        const quoted = m.reply_to ? msgs.find(x => x.id === m.reply_to) : undefined;
        return <div key={m.id} data-mid={m.id} className={flash === m.id ? 'is-flash' : ''}>{sep && <div className="converse-day"><span>{sep}</span></div>}{divider === m.id && <div className="converse-new" role="status"><span>New messages</span></div>}
          {m.kind === 'appointment' && m.sender === 'care-team' ? (() => {
            const n = data.notes.find(x => x.appointment_id === m.ref_id); const pc = n ? parseCard(n.observations) : null; const when = day(appt?.starts_at ?? m.created_at);
            return <div className={`converse-row ${mine ? 'is-mine' : 'is-theirs'}`}><div className={`converse-bubble ${mine ? 'is-mine' : 'is-theirs'}`}><p>{m.body}</p>
              <div className="converse-svara"><div className="converse-svara-head"><span className="converse-svara-icon"><FileText /></span><span><strong>Online consultation summary</strong><small>{when}</small></span></div>
                <DocumentActions meta={{ kind: 'online', babyName: baby.baby_name, caregiverName: baby.caregiver_name, reason: appt?.reason ?? 'Online consultation', when, clinician: CARE_TEAM_DOCTOR }} card={pc} label="Approved" approved />
                <div className="converse-svara-actions"><Button type="button" size="sm" variant="outline" disabled={!pc} onClick={() => pc && onAskSutra?.({ name: `Consultation summary · ${when}`, text: `Online consultation for ${baby.baby_name} on ${when}\n${cardText(pc)}`, question: consultAskSutraQuestion(when) })}><Sparkles />Ask Sutra about this</Button></div></div>
              <time>{time(m.created_at)}</time></div></div>;
          })()
          : m.kind === 'appointment' ? <div className="converse-system"><span><CalendarDays size={13} />{m.body}</span>{appt && m.sender === 'system' && apptCard(appt)}</div>
            : <div className={`converse-row ${mine ? 'is-mine' : 'is-theirs'}`}><div className={`converse-bubble ${mine ? 'is-mine' : 'is-theirs'} ${menu === m.id ? 'is-menu' : ''} ${isImg ? 'is-image' : ''} ${rx?.length ? 'has-rx' : ''}`} onClick={() => { if (reactable) setMenu(v => v === m.id ? null : m.id); }}>
              {menu === m.id && <div className="converse-actions" onClick={e => e.stopPropagation()}>
                <div className="converse-react-bar">{QUICK_REACTIONS.map(e => <button key={e} type="button" aria-label={`React ${e}`} className={rx?.some(x => x.emoji === e && x.mine) ? 'is-on' : ''} onClick={() => void react(m.id, e)}>{e}</button>)}
                  <Popover open={moreFor === m.id} onOpenChange={o => setMoreFor(o ? m.id : null)}><PopoverTrigger asChild><button type="button" aria-label="More reactions" className="converse-react-more"><Plus size={14} /></button></PopoverTrigger><PopoverContent className="converse-emoji-pop" align="center"><EmojiGrid onPick={e => void react(m.id, e)} /></PopoverContent></Popover></div>
                <div className="converse-action-row"><button type="button" onClick={() => { setReplyTo(m.id); setEditing(null); setMenu(null); textRef.current?.focus(); }}><Reply size={13} />Reply</button>{m.kind === 'text' && <button type="button" onClick={() => { void navigator.clipboard.writeText(m.body); setMenu(null); setNotice('Message copied.'); }}><Copy size={13} />Copy</button>}{isImg && img && <button type="button" onClick={() => { const a = document.createElement('a'); a.href = img; a.download = m.file?.name ?? 'image'; a.click(); setMenu(null); }}><Download size={13} />Download</button>}{mine && m.kind === 'text' && <button type="button" onClick={() => { setEditing(m.id); setDraft(m.body); setMenu(null); }}><Pencil size={13} />Edit</button>}{mine && m.kind !== 'svara_card' && <button type="button" className="is-danger" disabled={busy} onClick={() => void remove(m.id)}><Trash2 size={13} />Delete</button>}</div>
              </div>}
              {m.reply_to && <button type="button" className="converse-quote" onClick={e => { e.stopPropagation(); if (m.reply_to) jumpTo(m.reply_to); }}><strong>{quoted ? who(quoted.sender) : 'Message'}</strong><span>{quoted ? preview(quoted) : 'Original message was deleted'}</span></button>}
              {m.kind === 'svara_card' ? (() => {
                const c = data.cards.find(x => x.id === m.ref_id); const pc = c ? parseCard(c.summary_text) : null; const when = day(c?.created_at ?? m.created_at);
                return <>{!isLegacySvaraBody(m.body) && <p>{m.body}</p>}
                  <div className="converse-svara" onClick={e => e.stopPropagation()}>
                    <div className="converse-svara-head"><span className="converse-svara-icon"><Activity /></span><span><strong>Svara check-in</strong><small>{when}{c ? ` · ${c.priority}` : ''}</small></span></div>
                    <DocumentActions meta={{ kind: 'svara', babyName: baby.baby_name, caregiverName: baby.caregiver_name, reason: 'Svara voice check-in', when, clinician: CARE_TEAM_DOCTOR }} card={pc} label={c?.reviewed ? 'Approved' : 'Awaiting review'} approved={!!c?.reviewed} />
                    {role === 'care-team' && c && <div className="converse-svara-actions">{!c.reviewed && <Button type="button" size="sm" disabled={busy} onClick={() => void approveCard(c.id)}><Check />Approve</Button>}<Button type="button" size="sm" variant="outline" disabled={!pc} onClick={() => pc && onAskSutra?.({ name: `Svara check-in · ${when}`, text: `Svara check-in for ${baby.baby_name} on ${when}\n${cardText(pc)}`, question: svaraAskSutraQuestion(when) })}><Sparkles />Ask Sutra</Button></div>}
                  </div></>;
              })()
                : m.kind === 'voice' && m.file_id ? (audio[m.file_id] ? <audio controls autoPlay src={audio[m.file_id]} onClick={e => e.stopPropagation()} /> : <button type="button" className="converse-voice" onClick={e => { e.stopPropagation(); if (m.file_id) void openFile(m.file_id, true); }}><Mic size={14} />Play voice message</button>)
                  : isImg ? <div className="converse-image">{img ? <button type="button" className="converse-image-open" aria-label={`Open ${m.file?.name ?? 'image'}`} onClick={e => { e.stopPropagation(); setViewer({ src: img, name: m.file?.name ?? 'image' }); }}><img src={img} alt={m.file?.name ?? 'Shared photo'} /></button> : <div className="converse-image-loading">Loading photo…</div>}{img && <Button type="button" size="icon-xs" variant="secondary" className="converse-image-dl" aria-label="Download image" onClick={e => { e.stopPropagation(); const a = document.createElement('a'); a.href = img; a.download = m.file?.name ?? 'image'; a.click(); }}><Download /></Button>}</div>
                  : m.kind === 'file' && m.file_id ? <button type="button" className="converse-doc" onClick={e => { e.stopPropagation(); if (m.file_id) void openFile(m.file_id, false); }}><FileText /><span><strong>{m.file?.name ?? m.body}</strong><small>Tap to download</small></span><Download size={16} /></button>
                    : <p>{m.body}</p>}
              <time>{time(m.created_at)}{mine && <CheckCheck size={14} aria-label={read ? 'Read' : 'Delivered'} className={`converse-tick ${read ? 'is-read' : 'is-delivered'}`} />}</time>
              {!!rx?.length && <div className="converse-rx" onClick={e => e.stopPropagation()}>{rx.map(r => <button key={r.emoji} type="button" className={r.mine ? 'is-mine' : ''} aria-label={`${r.emoji} ${r.n}${r.mine ? ', tap to remove yours' : ''}`} onClick={() => r.mine && void react(m.id, r.emoji)}>{r.emoji}{r.n > 1 && <small>{r.n}</small>}</button>)}</div>}
            </div>{reactable && <span className="converse-hover-tools"><button type="button" className="converse-react-hint" aria-label="Reply" title="Reply" onClick={() => { setReplyTo(m.id); setEditing(null); textRef.current?.focus(); }}><Reply size={15} /></button><button type="button" className="converse-react-hint" aria-label="React" title="React" onClick={() => setMenu(m.id)}><SmilePlus size={15} /></button></span>}</div>}
        </div>;
      })}
      {sending.map(s => <div key={s.id} className="converse-row is-mine"><div className="converse-bubble is-mine is-sending"><p>{s.body}</p><time>Sending<Check size={14} aria-label="Sent, not delivered" className="converse-tick is-pending" /></time></div></div>)}
    </div>
    <form className="converse-composer" onSubmit={e => { e.preventDefault(); void submit(); }}>
      {replyTo && !editing && (() => { const q = msgs.find(x => x.id === replyTo); return q ? <div className="converse-reply-draft"><Reply size={15} /><button type="button" onClick={() => jumpTo(q.id)}><strong>Replying to {who(q.sender)}</strong><span>{preview(q)}</span></button><Button type="button" variant="ghost" size="icon-xs" aria-label="Cancel reply" onClick={() => setReplyTo(null)}><X /></Button></div> : null; })()}
      {editing && <div className="converse-chip"><Pencil size={13} /><span>Editing message</span><Button type="button" variant="ghost" size="icon-xs" aria-label="Cancel edit" onClick={() => { setEditing(null); setDraft(''); }}><X /></Button></div>}
      {pending && (pending.type.startsWith('audio/') ? <div className="converse-voice-draft"><Mic size={16} /><audio controls src={pendingUrl} aria-label="Voice message preview" /><Button type="button" variant="ghost" size="icon-sm" aria-label="Discard voice message" onClick={() => setPending(null)}><Trash2 /></Button></div> : pendingUrl ? <div className="converse-draft-image"><button type="button" aria-label="Preview photo" onClick={() => setViewer({ src: pendingUrl, name: pending.name })}><img src={pendingUrl} alt={pending.name} /></button><span>{pending.name}</span><Button type="button" variant="ghost" size="icon-xs" aria-label="Remove photo" onClick={() => setPending(null)}><X /></Button></div>
        : <div className="converse-chip"><FileText size={13} /><span>{pending.name}</span><Button type="button" variant="ghost" size="icon-xs" aria-label="Remove attachment" onClick={() => setPending(null)}><X /></Button></div>)}
      {voice.recording && <div className="converse-recording" role="status"><span className="voice-record-dot" /><strong>Recording voice message</strong><time>{Math.floor(voice.seconds / 60)}:{String(voice.seconds % 60).padStart(2, '0')}</time><Button type="button" variant="ghost" size="icon-sm" aria-label="Discard recording" onClick={() => voice.stop(true)}><Trash2 /></Button><Button type="button" variant="secondary" size="sm" onClick={() => voice.stop()}><Square />Stop</Button></div>}
      <div className="converse-bar">
        {([[docInput, '.pdf,.doc,.docx,.txt,.xls,.xlsx,.ppt,.pptx', false], [mediaInput, 'image/*,video/*', false], [audioInput, 'audio/*', false], [camInput, 'image/*', true]] as const).map(([r, accept, cam], i) => <input key={i} ref={r} type="file" hidden accept={accept} {...(cam ? { capture: 'environment' as const } : {})} onChange={e => { const f = e.target.files?.[0]; e.target.value = ''; if (f) choose(f); }} />)}
        <Popover open={attachOpen} onOpenChange={setAttachOpen}><PopoverTrigger asChild><Button type="button" variant="ghost" size="icon-sm" aria-label="Attach" disabled={busy || !!editing}><Paperclip /></Button></PopoverTrigger>
          <PopoverContent side="top" align="start" className="converse-attach-menu">{([[docInput, FileText, 'Document', 'is-doc'], [mediaInput, ImageIcon, 'Photos & videos', 'is-media'], [camInput, Camera, 'Camera', 'is-cam'], [audioInput, Headphones, 'Audio', 'is-audio']] as const).map(([r, Icon, label, cls]) => <button key={label} type="button" className={cls} onClick={() => { setAttachOpen(false); r.current?.click(); }}><span><Icon /></span>{label}</button>)}</PopoverContent></Popover>
        <Popover><PopoverTrigger asChild><Button type="button" variant="ghost" size="icon-sm" aria-label="Add emoji"><Smile /></Button></PopoverTrigger><PopoverContent side="top" align="start" className="converse-emoji-pop"><EmojiGrid onPick={insertEmoji} /></PopoverContent></Popover>
        <textarea ref={textRef} rows={1} value={draft} placeholder="Type a message" disabled={voice.recording || voice.starting} aria-label="Message" onChange={e => setDraft(e.target.value)} onKeyDown={e => { if (e.key === 'Enter' && !e.shiftKey && !e.nativeEvent.isComposing) { e.preventDefault(); void submit(); } }} />
        <Button type="button" variant="ghost" size="icon-sm" className="converse-mic" aria-label="Record voice message" title="Record voice message" disabled={busy || voice.starting || voice.recording || !!pending || !!editing} onClick={() => void voice.start()}><Mic /></Button>
        {(draft.trim() || pending || editing) && <Button type="submit" size="icon-sm" className="converse-send" aria-label={editing ? 'Save edit' : 'Send'} disabled={busy || voice.starting || voice.recording}>{editing ? <Check /> : <ArrowUp />}</Button>}
      </div>
    </form>
    {avatar && <AvatarPreview photo={avatar} onClose={() => setAvatar(null)} />}
    {notice && <HaloNotification message={notice} onClose={() => setNotice('')} />}
    {viewer && <ImageViewer src={viewer.src} name={viewer.name} onClose={() => setViewer(null)} />}
    {meeting && <OnlineMeeting id={meeting} onClose={() => { setMeeting(null); void qc.invalidateQueries(); }} />}
  </section>;
}
