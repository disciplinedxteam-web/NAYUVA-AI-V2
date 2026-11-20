import { useMemo, useState } from 'react';
import { CalendarDays, Check, ChevronLeft, ChevronRight, Clock, MapPin, Video } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { GlassToggle } from '@/components/ui/glass-toggle';
import { reasons } from '@/lib/care-domain';

export type ScheduleChoice = { date: string; time: string; endTime: string; reason: string; mode: 'offline' | 'online' };
const pad = (n: number) => String(n).padStart(2, '0');
const iso = (d: Date) => `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
export const scheduleLabel = (c: ScheduleChoice, babyName: string) =>
  `Schedule ${babyName}: ${new Date(c.date + 'T00:00').toLocaleDateString('en-IN', { weekday: 'short', day: 'numeric', month: 'short' })} at ${c.time}–${c.endTime} · ${c.mode === 'online' ? 'Online video' : 'In-person'} · ${c.reason}`;

/** Interactive Sutra reply: the clinician picks every detail; nothing is booked until Approve. */
export function SchedulePicker({ babyName, done, busy, onApprove, initial }: { babyName: string; done: boolean; busy: boolean; onApprove: (c: ScheduleChoice) => void; initial?: { date?: string; time?: string; mode?: 'online' | 'offline' } }) {
  const today = useMemo(() => { const d = new Date(); d.setHours(0, 0, 0, 0); return d; }, []);
  const [month, setMonth] = useState(() => initial?.date ? new Date(Number(initial.date.slice(0, 4)), Number(initial.date.slice(5, 7)) - 1, 1) : new Date(today.getFullYear(), today.getMonth(), 1));
  const [date, setDate] = useState(initial?.date && initial.date >= iso(today) ? initial.date : ''); const [time, setTime] = useState(initial?.time ?? ''); const [endTime, setEndTime] = useState(() => { const t = initial?.time; if (!t) return ''; const m = Number(t.slice(0, 2)) * 60 + Number(t.slice(3)) + 30; return m < 1440 ? `${pad(Math.floor(m / 60))}:${pad(m % 60)}` : ''; }); const [reason, setReason] = useState(reasons[0] ?? 'Routine newborn follow-up'); const [mode, setMode] = useState<'offline' | 'online'>(initial?.mode ?? 'offline');
  const days = useMemo(() => { const first = month.getDay(); const n = new Date(month.getFullYear(), month.getMonth() + 1, 0).getDate(); return [...Array(first).fill(null), ...Array.from({ length: n }, (_, i) => new Date(month.getFullYear(), month.getMonth(), i + 1))] as (Date | null)[]; }, [month]);
  const now = new Date(); const past = date === iso(now) && !!time && time <= `${pad(now.getHours())}:${pad(now.getMinutes())}`; const bad = !!time && !!endTime && endTime <= time;
  if (done) return <div className="sutra-schedule is-done"><Check aria-hidden="true" />Scheduling card closed</div>;
  return <div className="sutra-schedule" aria-label={`Schedule an appointment for ${babyName}`}>
    <div className="sutra-schedule-head"><CalendarDays aria-hidden="true" /><strong>Appointment for {babyName}</strong></div>
    <div className="sutra-schedule-grid">
      <div className="sutra-cal">
        <div className="sutra-cal-nav"><Button variant="ghost" size="icon-xs" aria-label="Previous month" disabled={month <= new Date(today.getFullYear(), today.getMonth(), 1)} onClick={() => setMonth(new Date(month.getFullYear(), month.getMonth() - 1, 1))}><ChevronLeft /></Button><span>{month.toLocaleDateString('en-IN', { month: 'long', year: 'numeric' })}</span><Button variant="ghost" size="icon-xs" aria-label="Next month" onClick={() => setMonth(new Date(month.getFullYear(), month.getMonth() + 1, 1))}><ChevronRight /></Button></div>
        <div className="sutra-cal-days">{['S', 'M', 'T', 'W', 'T', 'F', 'S'].map((d, i) => <small key={i}>{d}</small>)}{days.map((d, i) => d ? <button type="button" key={i} disabled={d < today} className={iso(d) === date ? 'is-on' : ''} aria-pressed={iso(d) === date} onClick={() => { setDate(iso(d)); }}>{d.getDate()}</button> : <span key={i} />)}</div>
      </div>
      <div className="sutra-schedule-side">
        <div className="time-fields sutra-time-fields"><label><span className="ws-label"><Clock size={13} aria-hidden="true" /> Start time</span><input className="ws-input" type="time" aria-label="Start time" value={time} onChange={e => setTime(e.target.value)} /></label><label><span className="ws-label">End time</span><input className="ws-input" type="time" aria-label="End time" min={time} value={endTime} onChange={e => setEndTime(e.target.value)} /></label></div>
        {bad && <p role="alert" className="sutra-slot-note">End time must be after start time.</p>}{past && <p role="alert" className="sutra-slot-note">Choose a time later than now.</p>}
        <label className="sutra-reason"><span className="ws-label">Reason</span><select value={reason} onChange={e => setReason(e.target.value)}>{reasons.map(r => <option key={r}>{r}</option>)}</select></label>
        <GlassToggle value={mode} onChange={v => setMode(v as 'offline' | 'online')} options={[{ key: 'offline', label: 'In-person' }, { key: 'online', label: 'Online' }]} />
      </div>
    </div>
    <div className="sutra-schedule-foot"><span>{mode === 'online' ? <Video size={14} /> : <MapPin size={14} />}{date && time ? `${date} · ${time}${endTime ? `–${endTime}` : ''} IST` : 'Choose a date and time'}</span><Button size="sm" disabled={!date || !time || !endTime || bad || past || busy} onClick={() => onApprove({ date, time, endTime, reason, mode })}><Check />Approve</Button></div>
  </div>;
}
