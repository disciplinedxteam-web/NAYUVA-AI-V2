/** Only variables registered on the published Sarvam app may cross its session boundary.
 * Personal questions and history are fetched by the agent using check_in_id.
 */
export const SVARA_VARIABLE_KEYS = ['baby_name', 'caregiver_name', 'check_in_id', 'check_in_status', 'gender', 'session_type'] as const;
export function registeredSvaraVariables(context: Record<string, string>): Record<string, string> {
  return Object.fromEntries(SVARA_VARIABLE_KEYS.filter(key => typeof context[key] === 'string').map(key => [key, context[key]]));
}
export function hasCaregiverAnswer(lines: { role: string; content: string }[]) {
  return lines.some(line => line.role === 'user' && line.content.trim().length > 0);
}