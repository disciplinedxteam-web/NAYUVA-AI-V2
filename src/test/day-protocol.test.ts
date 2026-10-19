import { describe, expect, it } from 'vitest';
import { babyDay, todaysCheckin, DAY_PROTOCOL } from '@/lib/day-protocol';
const at = (iso: string) => new Date(iso).getTime();
describe('day-wise Svara protocol', () => {
  it('has 42 days of three questions', () => { expect(DAY_PROTOCOL).toHaveLength(42); expect(DAY_PROTOCOL.every(d => d.questions.length === 3)).toBe(true); });
  it('counts the date of birth as day 1 in India time', () => {
    expect(babyDay('2026-10-19', at('2026-10-19T10:00:00+05:30'))).toBe(1);
    expect(babyDay('2026-09-29', at('2026-10-19T10:00:00+05:30'))).toBe(21);
    expect(babyDay('2026-01-01', at('2026-10-19T10:00:00+05:30'))).toBe(42);
  });
  it('opens with the day and asks that day’s questions, then the final concern', () => {
    const t = todaysCheckin({ dob: '2026-09-29', babyName: 'Aarav' }, at('2026-10-19T10:00:00+05:30'));
    expect(t.opening.startsWith('Today is day 21 for Aarav')).toBe(true);
    expect(t.questions.map(q => q.topic)).toEqual(['Feeding', 'Growth and development', 'Caregiver concerns', 'Caregiver concerns']);
  });
  it('adds a condition observation question for jaundice', () => {
    const t = todaysCheckin({ dob: '2026-10-19', neonatalConditions: ['Neonatal Jaundice'] }, at('2026-10-19T10:00:00+05:30'));
    expect(t.questions.some(q => q.source === 'condition' && q.topic === 'Skin and eye colour')).toBe(true);
  });
});
