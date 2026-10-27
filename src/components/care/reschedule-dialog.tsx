import { useEffect, useState } from 'react';
import { ArrowRight, CalendarClock } from 'lucide-react';
import { Dialog, DialogContent, DialogDescription, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';

const tz = { timeZone: 'Asia/Kolkata' } as const;
const todayIso = () => new Date().toLocaleDateString('en-CA', tz);

/** Centered caregiver reschedule request. The original time stays until the care team approves. */
export function RescheduleDialog({ open, onOpenChange, babyName, currentStart, busy, onSubmit }: {
  open: boolean; onOpenChange: (v: boolean) => void; babyName: string; currentStart: string; busy: boolean;
  onSubmit: (v: { date: string; time: string; note: string }) => void;
}) {
  const [date, setDate] = useState(''); const [time, setTime] = useState(''); const [note, setNote] = useState('');
  useEffect(() => { if (open) { setDate(''); setTime(''); setNote(''); } }, [open]);
  const current = new Date(currentStart).toLocaleString('en-IN', { weekday: 'short', day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit', ...tz });
  return <Dialog open={open} onOpenChange={onOpenChange}>
    <DialogContent className="reschedule-dialog">
      <div className="reschedule-icon"><CalendarClock aria-hidden="true" /></div>
      <DialogTitle className="reschedule-title">Reschedule appointment</DialogTitle>
      <DialogDescription className="reschedule-sub">{babyName} · currently {current} IST</DialogDescription>
      <form className="reschedule-form" onSubmit={e => { e.preventDefault(); if (date && time) onSubmit({ date, time, note }); }}>
        <div className="reschedule-row">
          <label><span>Preferred date</span><input className="ws-input" type="date" required min={todayIso()} value={date} onChange={e => setDate(e.target.value)} /></label>
          <label><span>Preferred time</span><input className="ws-input" type="time" required value={time} onChange={e => setTime(e.target.value)} /></label>
        </div>
        <label><span>Reason (optional)</span><textarea className="ws-input" rows={3} maxLength={300} placeholder="e.g. Baby has a vaccination that morning" value={note} onChange={e => setNote(e.target.value)} /></label>
        <p className="reschedule-hint">Your current time stays booked until the care team reviews this request.</p>
        <Button type="submit" className="ticket-cta" disabled={busy || !date || !time}>Send request<ArrowRight size={15} /></Button>
        <Button type="button" variant="ghost" onClick={() => onOpenChange(false)}>Keep current time</Button>
      </form>
    </DialogContent>
  </Dialog>;
}
