/** Only variables registered on the published Sarvam app may cross its session boundary.
 * Personal questions and history are fetched by the agent using check_in_id.
 */
export const SVARA_VARIABLE_KEYS = ['baby_name', 'caregiver_name', 'check_in_id', 'check_in_status', 'gender', 'session_type'] as const;
export function registeredSvaraVariables(context: Record<string, string>): Record<string, string> {
  const variables: Record<string, string> = {};
  for (const key of SVARA_VARIABLE_KEYS) { const value = context[key]; if (typeof value === 'string') variables[key] = value; }
  return variables;
}
export function hasCaregiverAnswer(lines: { role: string; content: string }[]) {
  return lines.some(line => line.role === 'user' && line.content.trim().length > 0);
}

/** Minimum caregiver answers before a (possibly partial) conversation becomes a draft Health Card. */
export const MIN_CAREGIVER_ANSWERS = 2;

/** A check-in becomes a draft Health Card when the caregiver gave at least two real answers,
 * regardless of who spoke last. No speech or an early hang-up (fewer answers) never creates a card;
 * topics that were not reached are marked "Not discussed" on the card. */
export function isConversationComplete(lines: { role: string; content: string }[]) {
  return lines.filter(line => line.role === 'user' && line.content.trim().length > 0).length >= MIN_CAREGIVER_ANSWERS;
}