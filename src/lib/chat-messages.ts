/** Browser-safe wording for automatic Converse messages tied to Svara check-ins. */
export const CARE_TEAM_DOCTOR = 'Dr. Ananya Rao';

export function indiaDate(iso: string) {
  return new Date(iso).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric', timeZone: 'Asia/Kolkata' });
}

/** Note sent by the caregiver together with an approved Svara Health Card. */
export function svaraShareMessage(date: string, dayOfLife?: number) {
  return `Hi ${CARE_TEAM_DOCTOR}, this is my Svara check-in from ${date}${dayOfLife ? ` (Day ${dayOfLife})` : ''}.`;
}

/** Reply posted for the clinician only when they press Approve on a check-in. */
export function svaraApprovedMessage(caregiverName: string, date: string) {
  const word = caregiverName.trim().split(/\s+/)[0] ?? '';
  const first = word ? word.charAt(0).toUpperCase() + word.slice(1).toLowerCase() : 'there';
  return `Hi ${first}, I've reviewed your Svara check-in from ${date}. Everything looks fine.`;
}

export function svaraAskSutraQuestion(date: string) {
  return `Hey, can you tell me what happened in this particular check-in from ${date}?`;
}

/** Older card messages stored a label instead of a note; they are shown without a note line. */
export function isLegacySvaraBody(body: string) {
  return !body.trim() || body.startsWith('Svara check-in Health Card');
}

/** Care-team message posted to Care Connect when an online consultation document is approved. */
export function consultSummaryMessage(caregiverName: string, date: string) {
  const word = caregiverName.trim().split(/\s+/)[0] ?? '';
  const first = word ? word.charAt(0).toUpperCase() + word.slice(1).toLowerCase() : 'there';
  return `Hi ${first}, here is the consultation summary of our online appointment on ${date}.`;
}

export function consultAskSutraQuestion(date: string) {
  return `Hey, can you summarise what was discussed in the online consultation on ${date}?`;
}
