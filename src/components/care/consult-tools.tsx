import { useState } from 'react';
import { useServerFn } from '@tanstack/react-start';
import { CalendarDays, ClipboardList, MessageCircle, Send, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { MessageResponse } from '@/components/ai-elements/message';
import { CarePlanForm } from './care-plan-form';
import { Scheduler } from './appointment-scheduler';
import { askSutra, savePlan, type getCareData } from '@/lib/care.functions';
import type { CarePlan } from '@/lib/care-domain';

type Data = Awaited<ReturnType<typeof getCareData>>;
type Run = (action: () => Promise<unknown>, message: string) => Promise<void>;
export type ConsultPanel = 'plan' | 'sutra' | 'milan';
export const consultPanels = [
  { key: 'plan', label: 'Care Plan', icon: ClipboardList },
  { key: 'sutra', label: 'Ask Sutra', icon: MessageCircle },
  { key: 'milan', label: 'Schedule follow-up', icon: CalendarDays },
] as const;

/** Inline quick-action panel shared by Lekha live/after and online consultations, so work never leaves the visit. */
export function ConsultToolsPanel({ panel, data, babyId, busy, run, note, onClose }: { panel: ConsultPanel; data: Data | null; babyId: string; busy: boolean; run: Run; note: string; onClose: () => void }) {
  const save = useServerFn(savePlan);
  const baby = data?.profiles.find(p => p.id === babyId);
  const label = consultPanels.find(x => x.key === panel)?.label;
  return <aside className="lekha-live-panel" aria-label={label}>
    <header><div><h2>{label}</h2><small>{baby?.baby_name ?? ''} · {note}</small></div><Button variant="ghost" size="icon" aria-label="Close panel" onClick={onClose}><X /></Button></header>
    <div className="lekha-live-panel-body">
      {panel === 'sutra' && <ConsultSutra babyId={babyId} />}
      {panel !== 'sutra' && !data && <p className="vroom-muted">Loading…</p>}
      {panel === 'plan' && baby && <CarePlanForm initial={baby.plan as unknown as CarePlan} busy={busy} onCancel={onClose} onSave={async plan => { await run(async () => { await save({ data: { id: baby.id, plan } }); onClose(); }, 'Care Plan updated.'); }} />}
      {panel === 'milan' && data && <Scheduler data={data} busy={busy} run={run} onDone={onClose} initialBabyId={babyId} />}
    </div>
  </aside>;
}

function ConsultSutra({ babyId }: { babyId: string }) {
  const ask = useServerFn(askSutra);
  const [question, setQuestion] = useState(''), [answer, setAnswer] = useState(''), [busy, setBusy] = useState(false), [error, setError] = useState(''), [conversationId, setConversationId] = useState<string>();
  return <form className="lekha-inline-sutra" onSubmit={e => { e.preventDefault(); setBusy(true); setError(''); void ask({ data: { babyId, question, conversationId, focus: [] } }).then(r => { setAnswer(r.answer); setConversationId(r.conversationId); setQuestion(''); }).catch(e => setError(e.message)).finally(() => setBusy(false)); }}>
    {answer && <MessageResponse>{answer}</MessageResponse>}
    <textarea className="ws-input" aria-label="Ask Sutra during appointment" value={question} maxLength={1500} onChange={e => setQuestion(e.target.value)} placeholder="Ask about this baby’s reviewed records…" />
    <Button disabled={busy || !question.trim()}><Send />{busy ? 'Thinking…' : 'Ask Sutra'}</Button>
    {error && <p role="alert">{error}</p>}
    <small>Reviewed records only. No medical advice.</small>
  </form>;
}
