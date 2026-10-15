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