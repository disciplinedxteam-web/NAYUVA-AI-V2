import { describe, expect, it } from 'vitest';
import { registeredSvaraVariables, hasCaregiverAnswer, isConversationComplete } from '@/lib/svara-agent-contract';

describe('published Sarvam variable contract', () => {
  it('excludes unregistered context variables for both call channels', () => {
    expect(registeredSvaraVariables({ baby_name: 'Baby', check_in_id: 'session', session_type: 'returning', channel: 'phone', questions_to_ask: 'private context', previous_updates: 'history' })).toEqual({ baby_name: 'Baby', check_in_id: 'session', session_type: 'returning' });
  });
  it('does not treat an empty startup or greeting as caregiver responses', () => {
    expect(hasCaregiverAnswer([{ role: 'bot', content: 'Hello' }, { role: 'user', content: ' ' }])).toBe(false);
    expect(hasCaregiverAnswer([{ role: 'user', content: 'Fed four times' }])).toBe(true);
  });
  it('creates no card when nothing is spoken', () => {
    expect(isConversationComplete([{ role: 'bot', content: 'Hello!' }, { role: 'user', content: '  ' }])).toBe(false);
  });
  it('creates no card when the call ends too early (one answer)', () => {
    expect(isConversationComplete([{ role: 'bot', content: 'How is feeding?' }, { role: 'user', content: 'Fed four times' }])).toBe(false);
  });
  it('creates a draft card after two answers even if the caregiver spoke last', () => {
    expect(isConversationComplete([
      { role: 'bot', content: 'How is feeding?' }, { role: 'user', content: 'Fed four times' },
      { role: 'bot', content: 'Anything else?' }, { role: 'user', content: 'No, that is all' },
    ])).toBe(true);
  });
});