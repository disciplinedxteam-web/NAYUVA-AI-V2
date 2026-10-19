import { useState } from 'react';
import { ArrowLeft, ArrowRight, Check, Phone, ShieldCheck, Stethoscope, CalendarClock, Baby, UserRound, ClipboardCheck, Pencil } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { GlassToggle } from '@/components/ui/glass-toggle';
import { TextField, SelectField } from './fields';
import { emptyPlan, planSchema, reasons, PROTOCOL_CATEGORIES, type CarePlan } from '@/lib/care-domain';
import { DAY_PROTOCOL, NEONATAL_CONDITIONS, conditionQuestions } from '@/lib/day-protocol';

const STEPS = [
  { label: 'Newborn', icon: Baby, title: "Let's begin with the newborn joining your care", lede: 'These birth details anchor the baby’s day-by-day check-in journey.' },
  { label: 'Caregiver', icon: UserRound, title: 'Who will be caring for the baby at home?', lede: 'Svara will reach this caregiver for daily check-ins, in their preferred language.' },
  { label: 'Daily protocol', icon: ClipboardCheck, title: 'Review what Svara will ask, day by day', lede: 'A fixed Day 1–42 schedule of caregiver questions. Review and approve — nothing here needs editing.' },
  { label: 'Conditions', icon: Stethoscope, title: 'Has the baby been diagnosed with any condition?', lede: 'Select documented conditions only. Svara adds gentle observation questions for each — it never diagnoses.' },
  { label: 'Follow-up', icon: CalendarClock, title: 'Would you like to schedule a follow-up in advance?', lede: 'Optional. You can also book it later from Milan.' },
  { label: 'Review', icon: Check, title: 'Everything looks ready — review and activate', lede: 'Confirm the details below. You can jump back to any step.' },
] as const;
const LANGS = ['English', 'हिन्दी', 'ಕನ್ನಡ', 'தமிழ்', 'తెలుగు', 'मराठी', 'বাংলা', 'ગુજરાતી', 'മലയാളം', 'ਪੰਜਾਬੀ', 'ଓଡ଼ିଆ'];
const fmt = (d: string) => d.length > 5 ? `${d.slice(0, 5)} ${d.slice(5)}` : d;

export function CarePlanForm({ initial, onSave, onCancel, busy }: { initial?: CarePlan | undefined; onSave: (plan: CarePlan) => Promise<void>; onCancel: () => void; busy: boolean }) {
  const [plan, setPlan] = useState<CarePlan>({ ...emptyPlan, ...initial, topicSchedules: initial?.topicSchedules ?? {}, neonatalConditions: initial?.neonatalConditions ?? [], protocolApproved: initial?.protocolApproved ?? false });
  const [step, setStep] = useState(0); const [week, setWeek] = useState('1'); const [error, setError] = useState('');
  const set = <K extends keyof CarePlan>(k: K, v: CarePlan[K]) => setPlan((p) => ({ ...p, [k]: v }));
  const digits = plan.mobile.replace(/\D/g, '').slice(-10);

  function validate(i: number) {
    if (i === 0) { if (!plan.babyName.trim()) return 'Enter the baby’s name'; if (!plan.dob) return 'Enter the date of birth'; if (!(plan.birthWeight > 0 && plan.birthWeight <= 10)) return 'Enter a birth weight between 0 and 10 kg'; }
    if (i === 1) { if (!plan.caregiverName.trim()) return 'Enter the caregiver’s name'; if (!/^[6-9]\d{9}$/.test(digits)) return 'Enter a valid 10-digit Indian mobile number'; }
    if (i === 2 && !plan.protocolApproved) return 'Approve the daily protocol to continue';
    if (i === 4 && Boolean(plan.followupDate) !== Boolean(plan.followupTime)) return 'Provide both follow-up date and time, or leave both empty';
    return '';
  }
  function go(to: number) { if (to > step) { for (let i = step; i < to; i++) { const e = validate(i); if (e) { setStep(i); setError(e); return; } } } setError(''); setStep(to); }
  async function submit() {
    const p = planSchema.safeParse({ ...plan, mobile: digits, categories: plan.categories.length ? plan.categories : PROTOCOL_CATEGORIES });
    if (!p.success) { setError(p.error.issues[0]?.message ?? 'Check your details'); return; }
    await onSave(p.data);
  }
  const S = STEPS[step]!; const days = DAY_PROTOCOL.slice((Number(week) - 1) * 7, Number(week) * 7);
  const overlays = conditionQuestions(plan.neonatalConditions);

  return <div className="cp">
    <nav className="cp-steps" aria-label="Care plan steps">{STEPS.map((s, i) => { const I = s.icon; return <button type="button" key={s.label} className={i === step ? 'current' : i < step ? 'done' : ''} onClick={() => go(i)} aria-current={i === step ? 'step' : undefined}><span>{i < step ? <Check /> : <I />}</span><em>{s.label}</em></button>; })}</nav>
    <form className="cp-card" onSubmit={(e) => { e.preventDefault(); if (step < 5) go(step + 1); else void submit(); }}>
      <header className="cp-head"><p className="eyebrow">Step {step + 1} of 6</p><h2>{S.title.replace('the baby', plan.babyName && step > 2 ? plan.babyName : 'the baby')}</h2><p>{S.lede}</p></header>
      <div className="cp-body">
        {step === 0 && <div className="cp-grid">
          <TextField label="Baby's full name" value={plan.babyName} onChange={(v) => set('babyName', v)} />
          <TextField label="Date of birth" type="date" value={plan.dob} onChange={(v) => set('dob', v)} />
          <SelectField label="Sex" value={plan.sex} options={['Male', 'Female', 'Other']} onChange={(v) => set('sex', v as CarePlan['sex'])} />
          <TextField label="Birth weight (kg)" type="number" value={plan.birthWeight} onChange={(v) => set('birthWeight', Number(v))} />
          <SelectField label="Gestational age" value={plan.gestationalAge} options={['Term', 'Preterm', 'Post-term']} onChange={(v) => set('gestationalAge', v as CarePlan['gestationalAge'])} />
          <SelectField label="Delivery type" value={plan.deliveryType} options={['Vaginal', 'C-section', 'Assisted']} onChange={(v) => set('deliveryType', v as CarePlan['deliveryType'])} />
        </div>}
        {step === 1 && <div className="cp-grid">
          <TextField label="Caregiver's full name" value={plan.caregiverName} onChange={(v) => set('caregiverName', v)} />
          <SelectField label="Relationship to baby" value={plan.relationship} options={['Mother', 'Father', 'Guardian', 'Other']} onChange={(v) => set('relationship', v as CarePlan['relationship'])} />
          <div className="care-field"><span>Mobile number</span><label className="svara-phone"><span className="svara-cc"><Phone aria-hidden="true" />+91</span><input inputMode="numeric" autoComplete="tel-national" aria-label="Caregiver mobile number" placeholder="98765 43210" value={fmt(digits)} onChange={(e) => set('mobile', e.target.value.replace(/\D/g, '').slice(0, 10))} /></label></div>
          <SelectField label="Preferred language" value={plan.language} options={LANGS} onChange={(v) => set('language', v)} />
        </div>}
        {step === 2 && <div className="cp-protocol">
          <div className="cp-governance"><ShieldCheck aria-hidden="true" /><p><strong>Clinically reviewed protocol.</strong> Every question has been reviewed and approved by multiple paediatricians and neonatologists. Svara is non-diagnostic: it records what the caregiver observes so your team can follow the baby day by day.</p></div>
          <div className="cp-week"><GlassToggle label="Week" value={week} onChange={setWeek} options={[1, 2, 3, 4, 5, 6].map((w) => ({ key: String(w), label: `Week ${w}` }))} /></div>
          <div className="cp-table" role="table" aria-label={`Week ${week} questions`}>
            {days.map((d) => <div role="row" key={d.day} className="cp-row"><div role="rowheader" className="cp-day"><strong>Day {d.day}</strong><span>{d.theme}</span></div>{d.questions.map((q) => <div role="cell" key={q.topic} className="cp-q" title={q.text}><b>{q.topic}</b><p>{q.text}</p></div>)}</div>)}
          </div>
          <label className={`cp-approve ${plan.protocolApproved ? 'on' : ''}`}><input type="checkbox" checked={plan.protocolApproved} onChange={(e) => set('protocolApproved', e.target.checked)} /><span><Check /></span>I have reviewed the Day 1–42 protocol and approve it for this baby</label>
        </div>}
        {step === 3 && <div className="cp-conditions">
          <div className="cp-chips">{NEONATAL_CONDITIONS.map((c) => { const on = plan.neonatalConditions.includes(c); return <button type="button" key={c} aria-pressed={on} className={on ? 'on' : ''} onClick={() => set('neonatalConditions', on ? plan.neonatalConditions.filter((x) => x !== c) : [...plan.neonatalConditions, c])}>{on && <Check />}{c}</button>; })}</div>
          <p className="cp-note">{plan.neonatalConditions.length ? `Adds ${overlays.length} daily observation ${overlays.length === 1 ? 'question' : 'questions'}: ${overlays.map((o) => o.topic).join(' · ')}` : 'No conditions selected — Svara follows the healthy-newborn protocol.'}</p>
        </div>}
        {step === 4 && <div className="cp-grid">
          <TextField label="Follow-up date (optional)" type="date" value={plan.followupDate} onChange={(v) => set('followupDate', v)} />
          <TextField label="Time (India time)" type="time" value={plan.followupTime} onChange={(v) => set('followupTime', v)} />
          <SelectField label="Reason" value={plan.followupReason} options={reasons} onChange={(v) => set('followupReason', v)} />
          {(plan.followupDate || plan.followupTime) && <div className="care-field cp-clear"><span>&nbsp;</span><Button type="button" variant="outline" onClick={() => setPlan((p) => ({ ...p, followupDate: '', followupTime: '' }))}>Skip follow-up for now</Button></div>}
        </div>}
        {step === 5 && <div className="cp-review">
          <section><h3>Newborn <button type="button" onClick={() => go(0)} aria-label="Edit newborn"><Pencil /></button></h3><p><strong>{plan.babyName}</strong></p><p>{plan.dob || '—'} · {plan.sex} · {plan.birthWeight} kg</p><p>{plan.gestationalAge} · {plan.deliveryType}</p></section>
          <section><h3>Caregiver <button type="button" onClick={() => go(1)} aria-label="Edit caregiver"><Pencil /></button></h3><p><strong>{plan.caregiverName}</strong> · {plan.relationship}</p><p>+91 {fmt(digits)}</p><p>{plan.language}</p></section>
          <section><h3>Svara protocol <button type="button" onClick={() => go(2)} aria-label="Edit protocol"><Pencil /></button></h3><p><strong>Day 1–42 daily check-ins</strong></p><p>{plan.protocolApproved ? 'Approved by care team' : 'Not approved'}</p></section>
          <section><h3>Conditions <button type="button" onClick={() => go(3)} aria-label="Edit conditions"><Pencil /></button></h3>{plan.neonatalConditions.length ? <div className="cp-tags">{plan.neonatalConditions.map((c) => <span key={c}>{c}</span>)}</div> : <p>Healthy-newborn baseline</p>}</section>
          <section><h3>Follow-up <button type="button" onClick={() => go(4)} aria-label="Edit follow-up"><Pencil /></button></h3><p>{plan.followupDate ? <><strong>{plan.followupDate} · {plan.followupTime}</strong><br />{plan.followupReason}</> : 'Not scheduled yet'}</p></section>
        </div>}
      </div>
      {error && <p role="alert" className="cp-error">{error}</p>}
      <footer className="cp-actions"><Button type="button" variant="ghost" onClick={step === 0 ? onCancel : () => go(step - 1)}><ArrowLeft />{step === 0 ? 'Cancel' : 'Back'}</Button><Button type="submit" size="lg" disabled={busy}>{busy ? 'Saving…' : step === 5 ? (initial ? 'Save care plan' : 'Approve & activate care plan') : 'Continue'}{step < 5 && <ArrowRight />}</Button></footer>
    </form>
  </div>;
}
