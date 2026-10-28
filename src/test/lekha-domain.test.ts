import { describe, expect, it } from 'vitest';
import { canStartLekhaMode, lekhaEligible } from '@/lib/lekha-domain';
const now = Date.parse('2026-10-20T08:12:00Z');
describe('Lekha documentation eligibility', () => {
  it('includes appointments today in India before completion', () => expect(lekhaEligible({ status: 'Confirmed', starts_at: '2026-10-20T14:00:00Z' }, now)).toBe(true));
  it('includes completed visits from previous days', () => expect(lekhaEligible({ status: 'Completed', starts_at: '2026-10-01T14:00:00Z' }, now)).toBe(true));
  it('excludes cancelled appointments today', () => expect(lekhaEligible({ status: 'Cancelled', starts_at: '2026-10-20T14:00:00Z' }, now)).toBe(false));
  it('excludes scheduled appointments tomorrow', () => expect(lekhaEligible({ status: 'Scheduled', starts_at: '2026-10-21T14:00:00Z' }, now)).toBe(false));
  it('requires a completed appointment for after-visit documentation', () => expect(canStartLekhaMode({ status: 'Scheduled', starts_at: '2026-10-20T14:00:00Z' }, 'after', now)).toBe(false));
  it('uses the India date across the UTC day boundary', () => expect(lekhaEligible({ status: 'Scheduled', starts_at: '2026-10-19T20:00:00Z' }, now)).toBe(true));
});import { isOnlineAppointment, lekhaReadyToSummarize } from '@/lib/lekha-domain';
describe('Lekha after-visit rules', () => {
  it('excludes online appointments from Lekha', () => expect(isOnlineAppointment({ location: { mode: 'online' } })).toBe(true));
  it('keeps in-person appointments in Lekha', () => expect(isOnlineAppointment({ location: { mode: 'offline' } })).toBe(false));
  it('blocks summarising three words with no topics', () => expect(lekhaReadyToSummarize(3, 0)).toBe(false));
  it('allows summarising at 20 words', () => expect(lekhaReadyToSummarize(20, 0)).toBe(true));
  it('allows summarising when two topics are covered', () => expect(lekhaReadyToSummarize(8, 2)).toBe(true));
  it('blocks 19 words with one topic', () => expect(lekhaReadyToSummarize(19, 1)).toBe(false));
});
