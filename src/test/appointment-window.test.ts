import { describe, expect, it } from 'vitest';
import { appointmentInputSchema } from '../lib/care-domain';
const base = { babyId:'00000000-0000-4000-8000-000000000001', date:'2026-10-15', time:'10:00', reason:'Follow-up' };
describe('appointment time window', () => {
  it('accepts a customized start and end time', () => { expect(appointmentInputSchema.parse({...base,endTime:'10:45'}).endTime).toBe('10:45'); });
  it('rejects an end before or equal to start', () => { expect(appointmentInputSchema.safeParse({...base,endTime:'09:45'}).success).toBe(false); expect(appointmentInputSchema.safeParse({...base,endTime:'10:00'}).success).toBe(false); });
});