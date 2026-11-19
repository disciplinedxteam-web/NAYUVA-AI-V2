import { useMemo, useState } from 'react';
import { CalendarDays, Check, ChevronLeft, ChevronRight, Clock, MapPin, Video } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { GlassToggle } from '@/components/ui/glass-toggle';
import { reasons } from '@/lib/care-domain';

export type ScheduleChoice = { date: string; time: string; reason: string; mode: 'offline' | 'online' };
const SLOTS = ['09:00', '09:30', '10:00', '10:30', '11:00', '11:30', '12:00', '14:00', '14:30', '15:00', '15:30', '16:00', '16:30', '17:00'];
const pad = (n: number) => String(n).padStart(2, '0');
const iso = (d: Date) => `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
export const scheduleLabel = (c: ScheduleChoice, babyName: string) =>
  `Schedule ${babyName}: ${new Date(c.date + 'T00:00').toLocaleDateString('en-IN', { weekday: 'short', day: 'numeric', month: 'short' })} at ${c.time} · ${c.mode === 'online' ? 'Online video' : 'In-person'} · ${c.reason}`;

/** Interactive Sutra reply: the clinician picks every detail; nothing is booked until Approve. */
export function SchedulePicker({ babyName, done, busy, onApprove }: { babyName: string; done: boolean; busy: boolean; onApprove: (c: ScheduleChoice) => void }) {
  const today = useMemo(() => { const d = new Date(); d.setHours(0, 0, 0, 0); return d; }, []);
  const [month, setMonth] = useState(() => new Date(today.getFullYear(), today.getMonth(), 1));
  const [date, setDate] = useState(''); const [time, setTime] = useState(''); const [reason, setReason] = useState(reasons[0] ?? 'Routine newborn follow-up'); const [mode, setMode] = useState<'offline' | 'online'>('offline');
  const days = useMemo(() => { const first = month.getDay(); const n = new Date(month.getFullYear(), month.getMonth() + 1, 0).getDate(); return [...Array(first).fill(null), ...Array.from({ length: n }, (_, i) => new Date(month.getFullYear(), month.getMonth(), i + 1))] as (Date | null)[]; }, [month]);
  const now = new Date(); const slots = SLOTS.filter(s => date !== iso(now) || s > `${pad(now.getHours())}:${pad(now.getMinutes())}`);
  if (done) return <div className="sutra-schedule is-done"><Check aria-hidden="true" />Scheduling card closed</div>;
  return <div className="sutra-schedule" aria-label={`Schedule an appointment for ${babyName}`}>
    <div className="sutra-schedule-head"><CalendarDays aria-hidden="true" /><strong>Appointment for {babyName}</strong></div>
    <div className="sutra-schedule-grid">
      <div className="sutra-cal">
        <div className="sutra-cal-nav"><Button variant="ghost" size="icon-xs" aria-label="Previous month" disabled={month <= new Date(today.getFullYear(), today.getMonth(), 1)} onClick={() => setMonth(new Date(month.getFullYear(), month.getMonth() - 1, 1))}><ChevronLeft /></Button><span>{month.toLocaleDateString('en-IN', { month: 'long', year: 'numeric' })}</span><Button variant="ghost" size="icon-xs" aria-label="Next month" onClick={() => setMonth(new Date(month.getFullYear(), month.getMonth() + 1, 1))}><ChevronRight /></Button></div>
        <div className="sutra-cal-days">{['S', 'M', 'T', 'W', 'T', 'F', 'S'].map((d, i) => <small key={i}>{d}</small>)}{days.map((d, i) => d ? <button type="button" key={i} disabled={d < today} className={iso(d) === date ? 'is-on' : ''} aria-pressed={iso(d) === date} onClick={() => { setDate(iso(d)); setTime(''); }}>{d.getDate()}</button> : <span key={i} />)}</div>
      </div>
      <div className="sutra-schedule-side">
        <span className="ws-label"><Clock size={13} aria-hidden="true" /> Time (IST)</span>
        <div className="sutra-slots">{date ? slots.map(s => <button type="button" key={s} className={s === time ? 'is-on' : ''} aria-pressed={s === time} onClick={() => setTime(s)}>{s}</button>) : <p>Pick a date first</p>}</div>
        <label className="sutra-reason"><span className="ws-label">Reason</span><select value={reason} onChange={e => setReason(e.target.value)}>{reasons.map(r => <option key={r}>{r}</option>)}</select></label>
        <GlassToggle value={mode} onChange={v => setMode(v as 'offline' | 'online')} options={[{ key: 'offline', label: 'In-person' }, { key: 'online', label: 'Online' }]} />
      </div>
    </div>
    <div className="sutra-schedule-foot"><span>{mode === 'online' ? <Video size={14} /> : <MapPin size={14} />}{date && time ? `${date} · ${time}` : 'Choose a date and time'}</span><Button size="sm" disabled={!date || !time || busy} onClick={() => onApprove({ date, time, reason, mode })}><Check />Approve</Button></div>
  </div>;
}
