import { describe, expect, it } from 'vitest';
import { registeredSvaraVariables, hasCaregiverAnswer } from '@/lib/svara-agent-contract';

describe('published Sarvam variable contract', () => {
  it('excludes unregistered context variables for both call channels', () => {
    expect(registeredSvaraVariables({ baby_name: 'Baby', check_in_id: 'session', session_type: 'returning', channel: 'phone', questions_to_ask: 'private context', previous_updates: 'history' })).toEqual({ baby_name: 'Baby', check_in_id: 'session', session_type: 'returning' });
  });
  it('does not treat an empty startup or greeting as caregiver responses', () => {
    expect(hasCaregiverAnswer([{ role: 'bot', content: 'Hello' }, { role: 'user', content: ' ' }])).toBe(false);
    expect(hasCaregiverAnswer([{ role: 'user', content: 'Fed four times' }])).toBe(true);
  });
});