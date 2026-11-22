
import { consultSummaryMessage } from './chat-messages';
import { test as t2, expect as e2 } from 'vitest';
t2('consultation summary message greets caregiver by first name with date', () => {
  e2(consultSummaryMessage('PRIYA SHARMA', '19 Nov 2026')).toBe('Hi Priya, here is the consultation summary of our online appointment on 19 Nov 2026.');
});
