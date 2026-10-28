export function lekhaEligible(appointment: { status: string; starts_at: string }, now = Date.now()) {
  if (appointment.status === 'Cancelled') return false;
  if (appointment.status === 'Completed') return true;
  const day = (date: number) => new Date(date).toLocaleDateString('en-CA', { timeZone: 'Asia/Kolkata' });
  return day(Date.parse(appointment.starts_at)) === day(now);
}
export function canStartLekhaMode(appointment: { status: string; starts_at: string }, mode: 'live' | 'after', now = Date.now()) {
  return mode === 'after' ? appointment.status === 'Completed' : appointment.status !== 'Completed' && lekhaEligible(appointment, now);
}/** Lekha documents in-person visits only; online visit summaries belong to the online appointment system. */
export function isOnlineAppointment(appointment: { location: unknown }) {
  return (appointment.location as Record<string, unknown> | null)?.['mode'] === 'online';
}
/** Deterministic summarise gate: at least 20 clinician words or two recommended topics covered. */
export const LEKHA_MIN_WORDS = 20;
export const LEKHA_MIN_TOPICS = 2;
export function lekhaReadyToSummarize(words: number, topicsCovered: number) {
  return words >= LEKHA_MIN_WORDS || topicsCovered >= LEKHA_MIN_TOPICS;
}
