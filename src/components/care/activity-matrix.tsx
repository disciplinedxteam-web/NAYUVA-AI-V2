import { Fragment } from 'react';

const tz = 'Asia/Kolkata';
export const dayKey = (d: Date) => d.toLocaleDateString('en-CA', { timeZone: tz });
const DAY_LABELS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];

/** Shared week × weekday activity calendar (same look as caregiver Home). Upcoming appointments show on future days. */
export function ActivityMatrix({ checkins, appointments, missed = [], weeks = 18, label }: { checkins: string[]; appointments: string[]; missed?: string[]; weeks?: number; label: string }) {
  const count = new Map<string, number>(); checkins.forEach(v => { const k = dayKey(new Date(v)); count.set(k, (count.get(k) ?? 0) + 1); });
  const appt = new Set(appointments.map(v => dayKey(new Date(v)))); const miss = new Set(missed.map(v => dayKey(new Date(v))));
  const today = new Date(); const todayKey = dayKey(today); const dow = (today.getDay() + 6) % 7;
  const pastWeeks = weeks - 2; const start = new Date(today); start.setDate(today.getDate() - dow - (pastWeeks - 1) * 7);
  const matrix = DAY_LABELS.map((_, d) => Array.from({ length: weeks }, (_, w) => { const dt = new Date(start); dt.setDate(start.getDate() + w * 7 + d); return dt; }));
  return <>
    <div className="bento-matrix activity-matrix" style={{ gridTemplateColumns: `30px repeat(${weeks}, 16px)` }} role="img" aria-label={label}>
      <span />{matrix[0]!.map((dt, w) => <span key={w} className="bento-axis">{w % 4 ? '' : dt.toLocaleDateString('en-IN', { day: '2-digit', month: 'short', timeZone: tz })}</span>)}
      {matrix.map((row, d) => <Fragment key={d}><span className="bento-axis">{DAY_LABELS[d]}</span>{row.map((dt, w) => {
        const k = dayKey(dt); const n = count.get(k) ?? 0; const a = appt.has(k); const future = dt > today && k !== todayKey;
        const cls = future ? (a ? 'appt upcoming' : 'future') : n && a ? 'both' : a ? 'appt' : n >= 2 ? 'heat-2' : n ? 'heat-1' : miss.has(k) ? 'missed' : '';
        return <span key={w} title={`${dt.toLocaleDateString('en-IN', { day: 'numeric', month: 'short', timeZone: tz })} · ${n} check-in${n === 1 ? '' : 's'}${a ? (future ? ' · upcoming appointment' : ' · appointment') : ''}${miss.has(k) && !n ? ' · missed check-in' : ''}`} className={`bento-tile ${cls} ${k === todayKey ? 'today' : ''}`} />;
      })}</Fragment>)}
    </div>
    <div className="bento-legend"><span><i className="bento-tile heat-1" />Check-in</span><span><i className="bento-tile heat-2" />2+ check-ins</span><span><i className="bento-tile appt" />Appointment</span><span><i className="bento-tile both" />Both</span>{missed.length > 0 && <span><i className="bento-tile missed" />Missed</span>}</div>
  </>;
}
