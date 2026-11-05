import { describe, expect, it } from 'vitest';
import { babyDay, todaysCheckin, DAY_PROTOCOL, NEONATAL_CONDITIONS, conditionQuestions, svaraBrief, SVARA_STYLE } from '@/lib/day-protocol';
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
    expect(t.opening.startsWith("Hi, I'm Svara from Nayuva AI")).toBe(true);
    expect(t.opening).toContain('Aarav');
    expect(t.questions.map(q => q.topic)).toEqual(['Feeding', 'Growth and development', 'Caregiver concerns', 'Caregiver concerns']);
  });
  it('adds a condition observation question for jaundice', () => {
    const t = todaysCheckin({ dob: '2026-10-19', neonatalConditions: ['Neonatal Jaundice'] }, at('2026-10-19T10:00:00+05:30'));
    expect(t.questions.some(q => q.source === 'condition' && q.topic === 'Skin and eye colour')).toBe(true);
  });
});

describe('Svara condition attribution, follow-ups and conversation rules', () => {
  const now = at('2026-10-19T10:00:00+05:30');
  it('prefixes condition questions with the care team attribution and names the condition', () => {
    const q = todaysCheckin({ dob: '2026-10-19', neonatalConditions: ['Neonatal Jaundice'] }, now).questions.find(x => x.source === 'condition')!;
    expect(q.text.startsWith('Since your care team noted neonatal jaundice in your baby\'s discharge care plan, I wanted to check:')).toBe(true);
  });
  it('gives every listed Care Plan condition an observation question', () => {
    for (const c of NEONATAL_CONDITIONS) expect(conditionQuestions([c]).length, c).toBeGreaterThan(0);
  });
  it('also uses the free-text conditions field', () => {
    expect(todaysCheckin({ dob: '2026-10-19', conditions: ['Oral Candidiasis (Thrush)'] }, now).questions.some(q => q.topic === 'Mouth and feeding comfort')).toBe(true);
  });
  it('asks about last check-in concerns first, and skips normal topics', () => {
    const t = todaysCheckin({ dob: '2026-10-19' }, now, [{ title: 'Umbilical cord', finding: 'Slight redness near the cord', status: 'Concern' }, { title: 'Feeding', finding: '8 feeds', status: 'Normal' }]);
    expect(t.questions[0]).toMatchObject({ source: 'followup', text: 'In your last check-in, you mentioned: Slight redness near the cord. How is that now?' });
    expect(t.questions.filter(q => q.source === 'followup')).toHaveLength(1);
  });
  it('brief keeps Svara non-diagnostic and introducing herself', () => {
    expect(SVARA_STYLE).toContain('Never diagnose');
    expect(SVARA_STYLE).toContain('Svara from Nayuva AI');
    expect(svaraBrief({ dob: '2026-10-19' }, now)).toContain(SVARA_STYLE);
  });
});
