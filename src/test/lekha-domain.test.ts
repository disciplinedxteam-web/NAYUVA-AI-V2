import { describe, expect, it } from 'vitest';
import { canStartLekhaMode, lekhaEligible, lekhaLiveTooShort } from '@/lib/lekha-domain';
const now = Date.parse('2026-10-20T08:12:00Z');
describe('Lekha documentation eligibility', () => {
  it('includes scheduled appointments on a future day', () => expect(lekhaEligible({ status: 'Scheduled', starts_at: '2026-10-25T14:00:00Z' }, now)).toBe(true));
  it('includes completed visits from previous days', () => expect(lekhaEligible({ status: 'Completed', starts_at: '2026-10-01T14:00:00Z' }, now)).toBe(true));
  it('excludes cancelled appointments', () => expect(lekhaEligible({ status: 'Cancelled', starts_at: '2026-10-20T14:00:00Z' }, now)).toBe(false));
  it('allows after-visit documentation without marking done', () => expect(canStartLekhaMode({ status: 'Scheduled', starts_at: '2026-10-20T14:00:00Z' }, 'after', now)).toBe(true));
  it('allows live capture after the appointment time has passed', () => expect(canStartLekhaMode({ status: 'Confirmed', starts_at: '2026-10-01T14:00:00Z' }, 'live', now)).toBe(true));
  it('blocks capture for cancelled appointments', () => expect(canStartLekhaMode({ status: 'Cancelled', starts_at: '2026-10-20T14:00:00Z' }, 'live', now)).toBe(false));
  it('treats 19 recorded words as too short', () => expect(lekhaLiveTooShort(19)).toBe(true));
  it('accepts 20 recorded words', () => expect(lekhaLiveTooShort(20)).toBe(false));
});
import { isOnlineAppointment, lekhaReadyToSummarize } from '@/lib/lekha-domain';
describe('Lekha after-visit rules', () => {
  it('excludes online appointments from Lekha', () => expect(isOnlineAppointment({ location: { mode: 'online' } })).toBe(true));
  it('keeps in-person appointments in Lekha', () => expect(isOnlineAppointment({ location: { mode: 'offline' } })).toBe(false));
  it('blocks summarising three words with no topics', () => expect(lekhaReadyToSummarize(3, 0)).toBe(false));
  it('allows summarising at 20 words', () => expect(lekhaReadyToSummarize(20, 0)).toBe(true));
  it('allows summarising when two topics are covered', () => expect(lekhaReadyToSummarize(8, 2)).toBe(true));
  it('blocks 19 words with one topic', () => expect(lekhaReadyToSummarize(19, 1)).toBe(false));
});
