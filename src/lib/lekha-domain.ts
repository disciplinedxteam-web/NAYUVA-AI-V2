export function lekhaEligible(appointment: { status: string; starts_at: string }, now = Date.now()) {
  if (appointment.status === 'Cancelled') return false;
  if (appointment.status === 'Completed') return true;
  const day = (date: number) => new Date(date).toLocaleDateString('en-CA', { timeZone: 'Asia/Kolkata' });
  return day(Date.parse(appointment.starts_at)) === day(now);
}
export function canStartLekhaMode(appointment: { status: string; starts_at: string }, mode: 'live' | 'after', now = Date.now()) {
  return mode === 'after' ? appointment.status === 'Completed' : appointment.status !== 'Completed' && lekhaEligible(appointment, now);
}