import { useEffect, useMemo, useRef, useState } from 'react';
import { useServerFn } from '@tanstack/react-start';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { ArrowUp, CalendarDays, Check, CheckCheck, ChevronLeft, ChevronRight, FileText, Mic, Paperclip, Pin, Square, Video, X, MapPin, Activity, Clock, Phone, Copy, Pencil, Trash2, Smile, History, Plus, Download, ZoomIn, ZoomOut, SmilePlus } from 'lucide-react';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { useSutraDictation } from '@/components/sutra/use-dictation';
import { Button } from '@/components/ui/button';
import { getCareData, getChat, sendChat, getChatFile, updateAppointment, editChat, deleteChat, reactChat } from '@/lib/care.functions';
import { parseCard } from '@/lib/care-card';
import { DocumentViewer } from '@/components/care/document-viewer';
import { LekhaDocument } from '@/components/care/lekha-document';
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

export function Converse({ data, role, babyId, onRead, onAskSutra }: { data: Data; role: DemoRole; babyId: string; onRead: () => void; onAskSutra?: (d: AskSutraDoc) => void }) {
  const editFn = useServerFn(editChat), delFn = useServerFn(deleteChat), reactFn = useServerFn(reactChat);
  const fetchChat = useServerFn(getChat), send = useServerFn(sendChat), file = useServerFn(getChatFile), change = useServerFn(updateAppointment);
  const qc = useQueryClient();
  const baby = data.babies.find(b => b.id === babyId);
  const chat = useQuery({ queryKey: ['chat', babyId], queryFn: () => fetchChat({ data: { babyId } }), refetchInterval: 5000, enabled: !!babyId });
  const { status, signal } = useNexconn(() => { void chat.refetch(); onRead(); });
  const [draft, setDraft] = useState(''), [busy, setBusy] = useState(false), [notice, setNotice] = useState(''), [meeting, setMeeting] = useState<string | null>(null), [doc, setDoc] = useState<string | null>(null);
  const [audio, setAudio] = useState<Record<string, string>>({}), [images, setImages] = useState<Record<string, string>>({});
  const [pending, setPending] = useState<File | null>(null), [pendingUrl, setPendingUrl] = useState(''), [editing, setEditing] = useState<string | null>(null), [menu, setMenu] = useState<string | null>(null);
  const [sending, setSending] = useState<{ id: string; body: string }[]>([]), [viewer, setViewer] = useState<{ src: string; name: string } | null>(null), [history, setHistory] = useState(false), [pinIndex, setPinIndex] = useState(0), [moreFor, setMoreFor] = useState<string | null>(null);
  const speech = useSutraDictation(draft, setDraft, 'en-IN');
  const list = useRef<HTMLDivElement>(null), fileInput = useRef<HTMLInputElement>(null), textRef = useRef<HTMLTextAreaElement>(null);
  const all = chat.data?.messages ?? [];
  const msgs = all.filter(m => m.kind !== 'reaction');
  const reactions = useMemo(() => { const r: Record<string, { emoji: string; mine: boolean; n: number }[]> = {}; for (const m of all) if (m.kind === 'reaction' && m.ref_id) { const l = r[m.ref_id] ??= []; const e = l.find(x => x.emoji === m.body); const mine = m.sender === (role === 'care-team' ? 'care-team' : 'caregiver'); if (e) { e.n++; e.mine ||= mine; } else l.push({ emoji: m.body, mine, n: 1 }); } return r; }, [all, role]);
  useEffect(() => { list.current?.scrollTo({ top: list.current.scrollHeight }); }, [msgs.length, sending.length, babyId, history]);
  useEffect(() => { if (chat.dataUpdatedAt) onRead(); }, [chat.dataUpdatedAt]);
  useEffect(() => { if (!pending || !pending.type.startsWith('image/')) { setPendingUrl(''); return; } const u = URL.createObjectURL(pending); setPendingUrl(u); return () => URL.revokeObjectURL(u); }, [pending]);
  // Images preview inline: load each image file once.
  useEffect(() => { for (const m of msgs) if (m.kind === 'file' && m.file_id && m.file?.mime?.startsWith('image/') && !images[m.file_id]) { const id = m.file_id; setImages(x => ({ ...x, [id]: '' })); void file({ data: { id } }).then(f => setImages(x => ({ ...x, [id]: `data:${f.mime};base64,${f.data}` }))).catch(() => undefined); } }, [msgs]);
  const pins = useMemo(() => pinnedAppointments(data.appointments, babyId), [data.appointments, babyId]);
  const pin = pins[Math.min(pinIndex, Math.max(0, pins.length - 1))];
  const me = role === 'care-team' ? 'care-team' : 'caregiver';

  async function post(kind: 'text' | 'voice' | 'file', body: string, f?: { name: string; mime: string; data: string }) {
    if (busy) return false; setBusy(true);
    const tmp = { id: crypto.randomUUID(), body: kind === 'text' ? body : f?.name ?? body };
    setSending(s => [...s, tmp]);
    try { await send({ data: { babyId, kind, body, ...(f ? { file: f } : {}) } }); await chat.refetch(); if (chat.data?.peer) void signal(chat.data.peer, JSON.stringify({ nv: 'msg', babyId })); return true; }
    catch (e) { setNotice(e instanceof Error ? e.message : 'Message not sent.'); return false; } finally { setSending(s => s.filter(x => x.id !== tmp.id)); setBusy(false); }
  }
  function choose(f: File) { if (f.size > 4_000_000) { setNotice('Files up to 4 MB can be shared.'); return; } setPending(f); }
  async function submit() {
    if (busy || speech.listening || speech.processing) return;
    const text = draft.trim();
    if (editing) { if (!text) return; setBusy(true); try { await editFn({ data: { id: editing, body: text } }); setEditing(null); setDraft(''); await chat.refetch(); } catch (e) { setNotice(e instanceof Error ? e.message : 'Could not edit.'); } finally { setBusy(false); } return; }
    if (pending) { const f = pending; const ok = await post('file', f.name, { name: f.name, mime: f.type, data: await toBase64(f) }); if (!ok) return; setPending(null); }
    if (text) { setDraft(''); if (!await post('text', text)) setDraft(text); }
  }
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
  const card = doc ? data.cards.find(c => c.id === doc) : undefined; const parsed = card ? parseCard(card.summary_text) : null;
  if (!baby) return <div className="converse-empty"><p>Select a caregiver to start conversing.</p></div>;
  if (history) return <ChatHistory data={data} role={role} babyId={babyId} onBack={() => setHistory(false)} onAsk={d => { setHistory(false); onAskSutra?.(d); }} />;
  let lastDay = '';
  const st = data.settings as Record<string, string>;
  const calls: [string, string][] = role === 'care-team' ? [[`Call ${baby.caregiver_name}`, (baby.plan as Record<string, string>)?.['mobile'] ?? '']] : [['Care Team', st['careTeamContact'] ?? ''], ['Hospital Emergency', st['emergencyContact'] ?? ''], ['Ambulance', st['ambulanceNumber'] ?? ''], ['After-hours', st['afterHoursContact'] ?? '']];
  const okCalls = calls.filter(([, n]) => n);
  return <section className="converse" aria-label={`Conversation with ${role === 'care-team' ? baby.caregiver_name : 'your care team'}`}>
    <header className="converse-head"><span className="converse-avatar">{(role === 'care-team' ? baby.baby_name : 'C').charAt(0)}</span><div className="converse-head-meta"><strong>{role === 'care-team' ? `${baby.baby_name} · ${baby.caregiver_name}` : 'Dr. Ananya Rao · Care Team'}</strong><small><i className={`converse-dot is-${status}`} />{status === 'live' ? 'Live chat connected' : status === 'connecting' ? 'Connecting…' : 'Syncing every few seconds'}</small></div>
      <Popover><PopoverTrigger asChild><Button variant="ghost" size="icon" className="converse-call" aria-label="Call options"><Phone /></Button></PopoverTrigger><PopoverContent align="end" className="converse-call-menu">{okCalls.length ? okCalls.map(([l, n]) => <a key={l} href={'tel:' + n.replace(/[^\d+]/g, '')}><Phone size={14} /><span><strong>{l}</strong><small>{n}</small></span></a>) : <p>No phone number saved yet.</p>}</PopoverContent></Popover>
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
        const isImg = m.kind === 'file' && !!m.file_id && !!m.file?.mime?.startsWith('image/'); const img = isImg ? images[m.file_id!] : undefined;
        const read = (role === 'care-team' ? m.read_by_caregiver_at : m.read_by_team_at);
        const rx = reactions[m.id];
        const reactable = ['text', 'voice', 'file', 'svara_card'].includes(m.kind);
        return <div key={m.id}>{sep && <div className="converse-day"><span>{sep}</span></div>}
          {m.kind === 'appointment' ? <div className="converse-system"><span><CalendarDays size={13} />{m.body}</span>{appt && m.sender === 'system' && apptCard(appt)}</div>
            : <div className={`converse-row ${mine ? 'is-mine' : 'is-theirs'}`}><div className={`converse-bubble ${mine ? 'is-mine' : 'is-theirs'} ${menu === m.id ? 'is-menu' : ''} ${isImg ? 'is-image' : ''} ${rx?.length ? 'has-rx' : ''}`} onClick={() => { if (reactable) setMenu(v => v === m.id ? null : m.id); }}>
              {menu === m.id && <div className="converse-actions" onClick={e => e.stopPropagation()}>
                <div className="converse-react-bar">{QUICK_REACTIONS.map(e => <button key={e} type="button" aria-label={`React ${e}`} className={rx?.some(x => x.emoji === e && x.mine) ? 'is-on' : ''} onClick={() => void react(m.id, e)}>{e}</button>)}
                  <Popover open={moreFor === m.id} onOpenChange={o => setMoreFor(o ? m.id : null)}><PopoverTrigger asChild><button type="button" aria-label="More reactions" className="converse-react-more"><Plus size={14} /></button></PopoverTrigger><PopoverContent className="converse-emoji-pop" align="center"><EmojiGrid onPick={e => void react(m.id, e)} /></PopoverContent></Popover></div>
                <div className="converse-action-row">{m.kind === 'text' && <button type="button" onClick={() => { void navigator.clipboard.writeText(m.body); setMenu(null); setNotice('Message copied.'); }}><Copy size={13} />Copy</button>}{isImg && img && <button type="button" onClick={() => { const a = document.createElement('a'); a.href = img; a.download = m.file?.name ?? 'image'; a.click(); setMenu(null); }}><Download size={13} />Download</button>}{mine && m.kind === 'text' && <button type="button" onClick={() => { setEditing(m.id); setDraft(m.body); setMenu(null); }}><Pencil size={13} />Edit</button>}{mine && m.kind !== 'svara_card' && <button type="button" className="is-danger" disabled={busy} onClick={() => void remove(m.id)}><Trash2 size={13} />Delete</button>}</div>
              </div>}
              {m.kind === 'svara_card' ? <button type="button" className="converse-doc" onClick={e => { e.stopPropagation(); setDoc(m.ref_id); }}><Activity /><span><strong>Svara Health Card</strong><small>{m.body}</small></span><FileText /></button>
                : m.kind === 'voice' && m.file_id ? (audio[m.file_id] ? <audio controls autoPlay src={audio[m.file_id]} onClick={e => e.stopPropagation()} /> : <button type="button" className="converse-voice" onClick={e => { e.stopPropagation(); void openFile(m.file_id!, true); }}><Mic size={14} />Play voice message</button>)
                  : isImg ? <div className="converse-image">{img ? <button type="button" className="converse-image-open" aria-label={`Open ${m.file?.name ?? 'image'}`} onClick={e => { e.stopPropagation(); setViewer({ src: img, name: m.file?.name ?? 'image' }); }}><img src={img} alt={m.file?.name ?? 'Shared photo'} /></button> : <div className="converse-image-loading">Loading photo…</div>}{img && <Button type="button" size="icon-xs" variant="secondary" className="converse-image-dl" aria-label="Download image" onClick={e => { e.stopPropagation(); const a = document.createElement('a'); a.href = img; a.download = m.file?.name ?? 'image'; a.click(); }}><Download /></Button>}</div>
                  : m.kind === 'file' && m.file_id ? <button type="button" className="converse-doc" onClick={e => { e.stopPropagation(); void openFile(m.file_id!, false); }}><FileText /><span><strong>{m.file?.name ?? m.body}</strong><small>Tap to download</small></span><Download size={16} /></button>
                    : <p>{m.body}</p>}
              <time>{time(m.created_at)}{mine && <CheckCheck size={14} aria-label={read ? 'Read' : 'Delivered'} className={`converse-tick ${read ? 'is-read' : 'is-delivered'}`} />}</time>
              {!!rx?.length && <div className="converse-rx" onClick={e => e.stopPropagation()}>{rx.map(r => <button key={r.emoji} type="button" className={r.mine ? 'is-mine' : ''} aria-label={`${r.emoji} ${r.n}${r.mine ? ', tap to remove yours' : ''}`} onClick={() => r.mine && void react(m.id, r.emoji)}>{r.emoji}{r.n > 1 && <small>{r.n}</small>}</button>)}</div>}
            </div>{reactable && <button type="button" className="converse-react-hint" aria-label="React" onClick={() => setMenu(m.id)}><SmilePlus size={15} /></button>}</div>}
        </div>;
      })}
      {sending.map(s => <div key={s.id} className="converse-row is-mine"><div className="converse-bubble is-mine is-sending"><p>{s.body}</p><time>Sending<Check size={14} aria-label="Sent, not delivered" className="converse-tick is-pending" /></time></div></div>)}
    </div>
    <form className="converse-composer" onSubmit={e => { e.preventDefault(); void submit(); }}>
      {editing && <div className="converse-chip"><Pencil size={13} /><span>Editing message</span><Button type="button" variant="ghost" size="icon-xs" aria-label="Cancel edit" onClick={() => { setEditing(null); setDraft(''); }}><X /></Button></div>}
      {pending && (pendingUrl ? <div className="converse-draft-image"><button type="button" aria-label="Preview photo" onClick={() => setViewer({ src: pendingUrl, name: pending.name })}><img src={pendingUrl} alt={pending.name} /></button><span>{pending.name}</span><Button type="button" variant="ghost" size="icon-xs" aria-label="Remove photo" onClick={() => setPending(null)}><X /></Button></div>
        : <div className="converse-chip"><FileText size={13} /><span>{pending.name}</span><Button type="button" variant="ghost" size="icon-xs" aria-label="Remove attachment" onClick={() => setPending(null)}><X /></Button></div>)}
      <div className="converse-bar">
        <input ref={fileInput} type="file" hidden accept="image/*,.pdf,.doc,.docx,.txt" onChange={e => { const f = e.target.files?.[0]; e.target.value = ''; if (f) choose(f); }} />
        <Button type="button" variant="ghost" size="icon-sm" aria-label="Attach photo or document" disabled={busy || !!editing} onClick={() => fileInput.current?.click()}><Paperclip /></Button>
        <Popover><PopoverTrigger asChild><Button type="button" variant="ghost" size="icon-sm" aria-label="Add emoji"><Smile /></Button></PopoverTrigger><PopoverContent side="top" align="start" className="converse-emoji-pop"><EmojiGrid onPick={insertEmoji} /></PopoverContent></Popover>
        <textarea ref={textRef} rows={1} value={draft} placeholder={speech.listening ? 'Listening… speak in any language' : 'Type a message'} aria-label="Message" onChange={e => setDraft(e.target.value)} onKeyDown={e => { if (e.key === 'Enter' && !e.shiftKey && !e.nativeEvent.isComposing) { e.preventDefault(); void submit(); } }} />
        {(speech.listening || speech.processing) && <span className="sutra-capture-status" role="status">{speech.processing ? 'Transcribing…' : 'Listening…'}</span>}
        {(draft.trim() || pending || editing) && !speech.listening
          ? <Button type="submit" size="icon-sm" className="converse-send" aria-label={editing ? 'Save edit' : 'Send'} disabled={busy || speech.processing}>{editing ? <Check /> : <ArrowUp />}</Button>
          : <Button type="button" variant={speech.listening ? 'default' : 'ghost'} size="icon-sm" className="converse-mic" aria-label={speech.listening ? 'Stop dictation' : 'Speak your message'} disabled={busy || speech.processing} onClick={speech.toggle}>{speech.listening ? <Square /> : <Mic />}</Button>}
      </div>
    </form>
    {speech.error && <p className="sutra-error" role="alert">{speech.error}</p>}
    {notice && <HaloNotification message={notice} onClose={() => setNotice('')} />}
    {viewer && <ImageViewer src={viewer.src} name={viewer.name} onClose={() => setViewer(null)} />}
    {meeting && <OnlineMeeting id={meeting} onClose={() => { setMeeting(null); void qc.invalidateQueries(); }} />}
    {card && <DocumentViewer title="Svara Health Card" onClose={() => setDoc(null)}>{parsed ? <LekhaDocument meta={{ kind: 'svara', babyName: baby.baby_name, caregiverName: baby.caregiver_name, reason: 'Svara voice check-in', when: day(card.created_at), clinician: 'Dr. Ananya Rao' }} card={parsed} approved={card.reviewed} /> : <p className="p-6">{card.quote}</p>}</DocumentViewer>}
  </section>;
}
