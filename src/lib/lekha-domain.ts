/** Any non-cancelled appointment can be documented, whenever the clinician is ready — no time window. */
export function lekhaEligible(appointment: { status: string; starts_at: string }, _now = Date.now()) {
  return appointment.status !== 'Cancelled';
}
/** Both During and After are always offered for any non-cancelled appointment, regardless of time. */
export function canStartLekhaMode(appointment: { status: string; starts_at: string }, _mode: 'live' | 'after', _now = Date.now()) {
  return appointment.status !== 'Cancelled';
}
/** Lekha documents in-person visits only; online visit summaries belong to the online appointment system. */
export function isOnlineAppointment(appointment: { location: unknown }) {
  return (appointment.location as Record<string, unknown> | null)?.['mode'] === 'online';
}
/** Deterministic summarise gate: at least 20 clinician words or two recommended topics covered. */
export const LEKHA_MIN_WORDS = 20;
export const LEKHA_MIN_TOPICS = 2;
export function lekhaReadyToSummarize(words: number, topicsCovered: number) {
  return words >= LEKHA_MIN_WORDS || topicsCovered >= LEKHA_MIN_TOPICS;
}
/** Live recording gate: fewer than 20 recognised words is treated as too short (accidental tap or mic failure). */
export function lekhaLiveTooShort(words: number) {
  return words < LEKHA_MIN_WORDS;
}
