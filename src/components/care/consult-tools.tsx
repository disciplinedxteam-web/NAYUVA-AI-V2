import { useEffect, type ReactNode } from 'react';
import { createPortal } from 'react-dom';
import { useServerFn } from '@tanstack/react-start';
import { ArrowLeft, CalendarDays, ChevronRight, ClipboardList, MessageCircle, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { CarePlanForm } from './care-plan-form';
import { Scheduler } from './appointment-scheduler';
import { SutraWorkspace } from '@/components/sutra/workspace';
import { savePlan, type getCareData } from '@/lib/care.functions';
import type { CarePlan, DemoRole } from '@/lib/care-domain';

type Data = Awaited<ReturnType<typeof getCareData>>;
type Run = (action: () => Promise<unknown>, message: string) => Promise<void>;
export type ConsultPanel = 'plan' | 'sutra' | 'milan';
export type PanelSize = 'wide' | 'narrow';
export const consultPanels = [
  { key: 'plan', label: 'Care Plan', description: 'View or edit what Svara asks about', icon: ClipboardList },
  { key: 'sutra', label: 'Ask Sutra', description: 'Ask about this baby’s reviewed records', icon: MessageCircle },
  { key: 'milan', label: 'Schedule follow-up', description: 'Book the next visit in Milan', icon: CalendarDays },
] as const;

/**
 * Right-edge side panel: fixed to the viewport edge and reserves its width on the page through a body attribute,
 * so the main screen reflows into the remaining space (70:30 wide, ~80:20 narrow) instead of being covered.
 */
export function SidePanel({ title, subtitle, size = 'wide', onClose, onBack, children }: { title: string; subtitle?: string; size?: PanelSize; onClose: () => void; onBack?: (() => void) | undefined; children: ReactNode }) {
  useEffect(() => { document.body.setAttribute('data-consult-panel', size); return () => document.body.removeAttribute('data-consult-panel'); }, [size]);
  const panel = <aside className={`side-panel is-${size}`} aria-label={title}>
    <header className="side-panel-head">
      {onBack && <Button variant="ghost" size="icon-sm" aria-label="Back to tools" onClick={onBack}><ArrowLeft /></Button>}
      <div><h2>{title}</h2>{subtitle && <small>{subtitle}</small>}</div>
      <Button variant="ghost" size="icon-sm" aria-label="Close panel" onClick={onClose}><X /></Button>
    </header>
    <div className="side-panel-body">{children}</div>
  </aside>;
  return typeof document === 'undefined' ? null : createPortal(panel, document.body);
}

/** Lists available tools with a short description; used where tools sit behind one side-panel button. */
export function ToolMenu({ options, onPick }: { options: readonly { key: string; label: string; description: string; icon: typeof ClipboardList }[]; onPick: (key: string) => void }) {
  return <div className="side-tool-menu">{options.map(o => <button type="button" key={o.key} className="side-tool-row" onClick={() => onPick(o.key)}><span className="side-tool-icon"><o.icon /></span><span><strong>{o.label}</strong><small>{o.description}</small></span><ChevronRight /></button>)}</div>;
}

/** Read-only Care Plan summary for caregivers. */
function PlanSummary({ plan }: { plan: CarePlan }) {
  const rows: [string, string][] = [
    ['Check-in schedule', `${plan.frequency ?? '—'}${plan.checkinTime ? ` · ${plan.checkinTime} IST` : ''}`],
    ['Approved observations', (plan.categories ?? []).join(', ') || '—'],
    ['Conditions noted by the care team', [...(plan.neonatalConditions ?? []), ...(plan.conditions ?? [])].filter(c => c && c !== 'None of the above').join(', ') || 'None noted'],
    ['Medicines', (plan.medications ?? []).length ? plan.medications.map(m => `${m.name} · ${m.frequency}${m.instructions ? ` · ${m.instructions}` : ''}`).join('; ') : 'No medicines listed'],
  ];
  return <dl className="side-plan-summary">{rows.map(([k, v]) => <div key={k}><dt>{k}</dt><dd>{v}</dd></div>)}<p>Only your care team can change this plan.</p></dl>;
}

/** Tool content shared by Lekha live/after, online consultations and Care Updates review, so work never leaves the visit. */
export function ConsultToolBody({ panel, data, babyId, role = 'care-team', busy, run, onClose }: { panel: ConsultPanel; data: Data | null; babyId: string; role?: DemoRole; busy: boolean; run: Run; onClose: () => void }) {
  const save = useServerFn(savePlan);
  const baby = data?.babies.find(p => p.id === babyId);
  if (!data) return <p className="vroom-muted">Loading care details…</p>;
  if (panel === 'sutra') return <SutraWorkspace data={data} role={role} babyId={babyId} compact />;
  if (panel === 'plan' && baby) return role === 'care-team'
    ? <CarePlanForm initial={baby.plan as unknown as CarePlan} busy={busy} onCancel={onClose} onSave={async plan => { await run(async () => { await save({ data: { id: baby.id, plan } }); onClose(); }, 'Care Plan updated.'); }} />
    : <PlanSummary plan={baby.plan as unknown as CarePlan} />;
  if (panel === 'milan') return <Scheduler data={data} busy={busy} run={run} onDone={onClose} initialBabyId={babyId} />;
  return null;
}

export function ConsultToolsPanel({ panel, data, babyId, role, busy, run, note, size, onClose, onBack }: { panel: ConsultPanel; data: Data | null; babyId: string; role?: DemoRole; busy: boolean; run: Run; note: string; size?: PanelSize; onClose: () => void; onBack?: () => void }) {
  const baby = data?.babies.find(p => p.id === babyId);
  const label = panel === 'plan' && role === 'caregiver' ? 'Your Care Plan' : consultPanels.find(x => x.key === panel)?.label ?? '';
  return <SidePanel title={label} subtitle={`${baby?.baby_name ?? ''}${baby ? ' · ' : ''}${note}`} {...(size ? { size } : {})} onClose={onClose} onBack={onBack}>
    <div className={`side-panel-tool is-${panel}`}><ConsultToolBody panel={panel} data={data} babyId={babyId} {...(role ? { role } : {})} busy={busy} run={run} onClose={onClose} /></div>
  </SidePanel>;
}
