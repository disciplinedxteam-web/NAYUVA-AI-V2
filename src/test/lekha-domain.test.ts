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
});