import { describe, it, expect } from 'vitest';
import { sutraScheduleHints } from '@/lib/sutra-domain';
const now = new Date(2026, 10, 19, 20, 0);
describe('sutraScheduleHints', () => {
  it('reads day-month and pm time', () => expect(sutraScheduleHints('Schedule Janvi on 22 Nov at 3 pm online', now)).toEqual({ date: '2026-11-22', time: '15:00', mode: 'online' }));
  it('reads tomorrow and 24h time', () => expect(sutraScheduleHints('book tomorrow 10:30', now)).toEqual({ date: '2026-11-20', time: '10:30' }));
  it('returns nothing when no details', () => expect(sutraScheduleHints('schedule an appointment', now)).toEqual({}));
});
