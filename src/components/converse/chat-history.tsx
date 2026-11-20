import { useState } from 'react';
import { ArrowLeft, Sparkles, CalendarDays, Activity } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { GlassToggle } from '@/components/ui/glass-toggle';
import { WorkspaceHeading } from '@/components/care/workspace-heading';
import { DocumentActions } from '@/components/care/document-actions';
import { parseCard, cardText, type CareCard } from '@/lib/care-card';
import type { getCareData } from '@/lib/care.functions';
import type { DemoRole } from '@/lib/care-domain';

type Data = Awaited<ReturnType<typeof getCareData>>;
export type AskSutraDoc = { name: string; text: string };
const day = (v: string) => new Date(v).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric', timeZone: 'Asia/Kolkata' });

/** Full-pane history for one baby: past appointments and past Svara check-ins, each with view/download/share and Ask Sutra. */
export function ChatHistory({ data, role, babyId, onBack, onAsk }: { data: Data; role: DemoRole; babyId: string; onBack: () => void; onAsk: (d: AskSutraDoc) => void }) {
  const [tab, setTab] = useState<'appointments' | 'svara'>('appointments');
  const baby = data.babies.find(b => b.id === babyId);
  if (!baby) return null;
  const visits = data.notes.filter(n => n.baby_id === babyId).map(n => { const a = data.appointments.find(x => x.id === n.appointment_id); const online = (a?.location as Record<string, unknown> | null)?.['mode'] === 'online'; return { id: n.id, when: a?.starts_at ?? n.created_at, reason: a?.reason ?? 'Consultation', online, card: parseCard(n.observations) }; }).sort((a, b) => b.when.localeCompare(a.when));
  const checkins = data.cards.filter(c => c.baby_id === babyId).map(c => ({ id: c.id, when: c.created_at, card: parseCard(c.summary_text), reviewed: c.reviewed, category: c.category }));
  const ask = (title: string, when: string, card: CareCard | null) => card && onAsk({ name: `${title} · ${day(when)}`, text: `${title} for ${baby.baby_name} on ${day(when)}\n${cardText(card)}` });
  const rows = tab === 'appointments'
    ? visits.map(v => <li key={v.id} className="chat-history-row"><span className="chat-history-icon"><CalendarDays /></span><div className="chat-history-meta"><strong>{v.reason}</strong><small>{v.online ? 'Online' : 'In-person'} appointment · {day(v.when)}</small></div><DocumentActions meta={{ kind: v.online ? 'online' : 'encounter', babyName: baby.baby_name, caregiverName: baby.caregiver_name, reason: v.reason, when: day(v.when), clinician: 'Dr. Ananya Rao' }} card={v.card} /><Button size="sm" variant="outline" className="chat-ask-sutra" disabled={!v.card} onClick={() => ask('Appointment summary', v.when, v.card)}><Sparkles />Ask Sutra</Button></li>)
    : checkins.map(c => <li key={c.id} className="chat-history-row"><span className="chat-history-icon"><Activity /></span><div className="chat-history-meta"><strong>Svara check-in</strong><small>{c.category} · {day(c.when)}</small></div><DocumentActions meta={{ kind: 'svara', babyName: baby.baby_name, caregiverName: baby.caregiver_name, reason: 'Svara voice check-in', when: day(c.when), clinician: 'Dr. Ananya Rao' }} card={c.card} label={c.reviewed ? 'Reviewed' : 'Awaiting review'} approved={c.reviewed} /><Button size="sm" variant="outline" className="chat-ask-sutra" disabled={!c.card} onClick={() => ask('Svara check-in', c.when, c.card)}><Sparkles />Ask Sutra</Button></li>);
  return <section className="chat-history" aria-label="Conversation history">
    <Button variant="ghost" size="sm" className="chat-history-back" onClick={onBack}><ArrowLeft />Back to chat</Button>
    <WorkspaceHeading title={role === 'care-team' ? `${baby.baby_name}'s history` : 'Your history'} description={role === 'care-team' ? `Past appointments and Svara check-ins shared with ${baby.caregiver_name}. Open, download or share any record, or ask Sutra about it.` : 'Your past appointments and Svara check-ins. Open, download or share any record, or ask Sutra about it.'} />
    <div className="chat-history-toggle"><GlassToggle label="History type" value={tab} onChange={v => setTab(v as typeof tab)} options={[{ key: 'appointments', label: 'Past appointments', count: visits.length }, { key: 'svara', label: 'Past Svara check-ins', count: checkins.length }]} /></div>
    {rows.length ? <ul className="chat-history-list">{rows}</ul> : <p className="converse-hint">{tab === 'appointments' ? 'No past appointments yet.' : 'No Svara check-ins yet.'}</p>}
  </section>;
}
