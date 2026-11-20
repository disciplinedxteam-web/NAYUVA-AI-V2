import { describe, it, expect } from 'vitest';
import { sutraScheduleIntent } from '@/lib/sutra-domain';
import { pinnedAppointment } from '@/components/converse/converse';

describe('Sutra scheduling intent', () => {
  it('opens the scheduling card when asked to schedule for a baby', () => { expect(sutraScheduleIntent('I want to schedule a appointment for Aarav')).toBe(true); });
  it('does not open it for a record question', () => { expect(sutraScheduleIntent('Summarize the latest feeding updates')).toBe(false); });
});
describe('pinned appointment', () => {
  const base = { baby_id: 'b1', status: 'Scheduled', reason: 'x' } as never;
  const at = (h: number) => new Date(Date.UTC(2026, 10, 20, h)).toISOString();
  const now = Date.UTC(2026, 10, 20, 8);
  it('pins the next upcoming open appointment for that baby', () => {
    const list = [{ ...(base as object), id: 'late', starts_at: at(14) }, { ...(base as object), id: 'soon', starts_at: at(10) }, { ...(base as object), id: 'cancel', status: 'Cancelled', starts_at: at(9) }] as never;
    expect(pinnedAppointment(list, 'b1', now)?.id).toBe('soon');
  });
  it('never pins cancelled or completed visits', () => {
    const list = [{ ...(base as object), id: 'c', status: 'Completed', starts_at: at(10) }] as never;
    expect(pinnedAppointment(list, 'b1', now)).toBeUndefined();
  });
});

import { pinnedAppointments as allPins } from '@/components/converse/converse';
import { describe as d2, it as i2, expect as e2 } from 'vitest';
d2('pinned appointment carousel', () => {
  i2('lists every open upcoming appointment soonest first, skipping cancelled', () => {
    const now = Date.parse('2026-11-20T00:00:00Z');
    const mk = (id: string, at: string, status = 'Scheduled') => ({ id, baby_id: 'b', starts_at: at, status }) as never;
    const r = allPins([mk('c', '2026-11-25T05:00:00Z'), mk('a', '2026-11-21T05:00:00Z'), mk('x', '2026-11-22T05:00:00Z', 'Cancelled'), mk('b', '2026-11-23T05:00:00Z')], 'b', now);
    e2(r.map((x: { id: string }) => x.id)).toEqual(['a', 'b', 'c']);
  });
});
