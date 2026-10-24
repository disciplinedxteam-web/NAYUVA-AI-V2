import { describe, expect, it } from 'vitest';
import { appointmentInputSchema } from '../lib/care-domain';
const base = { babyId:'00000000-0000-4000-8000-000000000001', date:'2026-10-15', time:'10:00', reason:'Follow-up' };
describe('appointment time window', () => {
  it('accepts a customized start and end time', () => { expect(appointmentInputSchema.parse({...base,endTime:'10:45'}).endTime).toBe('10:45'); });
  it('rejects an end before or equal to start', () => { expect(appointmentInputSchema.safeParse({...base,endTime:'09:45'}).success).toBe(false); expect(appointmentInputSchema.safeParse({...base,endTime:'10:00'}).success).toBe(false); });
});import { onlineJoinState } from '../lib/care-domain';
describe('online join window', () => {
  const s='2026-10-15T10:00:00Z', at=(m:number)=>Date.parse(s)+m*60000;
  it('is closed more than 1 hour before', () => expect(onlineJoinState(s,at(-61))).toBe('early'));
  it('opens exactly 1 hour before', () => expect(onlineJoinState(s,at(-60))).toBe('open'));
  it('still open 5 hours late', () => expect(onlineJoinState(s,at(300))).toBe('open'));
  it('expires after 5 hours late', () => expect(onlineJoinState(s,at(301))).toBe('expired'));
});
