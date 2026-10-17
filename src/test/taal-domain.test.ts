import { describe,it,expect } from 'vitest';
import { taalStatus,scheduledWindow,summarizeActivity } from '@/lib/taal-domain';
describe('Taal fortnight rules',()=>{
 it('uses an 80 percent boundary for Active',()=>{expect(taalStatus(8,10)).toBe('Active');expect(taalStatus(7,10)).toBe('Overdue');});
 it('uses a 50 percent boundary for Overdue',()=>{expect(taalStatus(5,10)).toBe('Overdue');expect(taalStatus(4,10)).toBe('Unresponsive');});
 it('does not classify profiles with no due activities',()=>expect(taalStatus(0,0)).toBe('Not yet due'));
 it('automatically recovers as completed activities increase',()=>{expect(taalStatus(1,4)).toBe('Unresponsive');expect(taalStatus(2,4)).toBe('Overdue');expect(taalStatus(4,4)).toBe('Active');});
 it('counts only slots within 14 days',()=>{const now=Date.parse('2026-10-17T12:30:00Z');const s=scheduledWindow({frequency:'Daily',customInterval:1,checkinTime:'18:00'},'2026-09-01T00:00:00Z',now);expect(s.length).toBe(15);expect(s[0]).toBe(now-14*86400000);});
 it('states factual missed activity rather than clinical risk',()=>expect(summarizeActivity([{id:'a',when:'2026-10-17',kind:'Appointment',complete:false,detail:'Follow-up'}]).missed).toBe(1));
});