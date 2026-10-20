import { describe, it, expect } from 'vitest';
import { detectChecklist, lekhaChecklist } from '@/lib/lekha-checklist';

describe('Lekha checklist detection', () => {
  it('ticks topics the clinician actually mentions', () => {
    const done = detectChecklist('Weight is 3.2 kg. Continue feeding. Follow-up next week.', 0);
    expect(done.has('exam')).toBe(true);
    expect(done.has('treatment')).toBe(true);
    expect(done.has('next')).toBe(true);
    expect(done.has('history')).toBe(false);
  });
  it('has exactly eight optional documentation topics', () => expect(lekhaChecklist).toHaveLength(8));
  it('includes attachments within the reports topic', () => {
    expect(detectChecklist('', 0).has('reports')).toBe(false);
    expect(detectChecklist('', 1).has('reports')).toBe(true);
  });
});
