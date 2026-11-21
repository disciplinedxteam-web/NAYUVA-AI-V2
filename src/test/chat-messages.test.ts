import { describe, expect, it } from 'vitest';
import { indiaDate, isLegacySvaraBody, svaraApprovedMessage, svaraAskSutraQuestion, svaraShareMessage } from '@/lib/chat-messages';

describe('automatic Svara chat messages', () => {
  it('caregiver note greets the doctor with the check-in date and day', () => {
    expect(svaraShareMessage('21 Nov 2026', 9)).toBe('Hi Dr. Ananya Rao, this is my Svara check-in from 21 Nov 2026 (Day 9).');
  });
  it('approval reply addresses the caregiver by first name', () => {
    expect(svaraApprovedMessage('Sudha Iyer', '21 Nov 2026')).toBe("Hi Sudha, I've reviewed your Svara check-in from 21 Nov 2026. Everything looks fine.");
    expect(svaraApprovedMessage('PRIYA', '21 Nov 2026')).toBe("Hi Priya, I've reviewed your Svara check-in from 21 Nov 2026. Everything looks fine.");
  });
  it('Ask Sutra question refers to that check-in', () => {
    expect(svaraAskSutraQuestion('21 Nov 2026')).toBe('Hey, can you tell me what happened in this particular check-in from 21 Nov 2026?');
  });
  it('old label-only card messages show no note', () => {
    expect(isLegacySvaraBody('Svara check-in Health Card · Routine')).toBe(true);
    expect(isLegacySvaraBody(svaraShareMessage('21 Nov 2026'))).toBe(false);
  });
  it('dates use India time', () => {
    expect(indiaDate('2026-11-20T20:00:00Z')).toBe('21 Nov 2026');
  });
});
