import { describe, it, expect } from 'vitest';
import { canReadSutraConversation, sutraGreeting } from '@/lib/sutra-domain';
describe('Sutra history boundaries',()=>{
 const c={baby_id:'baby-a',audience:'caregiver',workspace:'hackathon-demo'};
 it('does not expose another baby’s chat',()=>{expect(canReadSutraConversation(c,'baby-b','caregiver')).toBe(false);expect(canReadSutraConversation(c,'baby-a','caregiver')).toBe(true);});
 it('does not share care-team and caregiver history',()=>{expect(canReadSutraConversation(c,'baby-a','care-team')).toBe(false);});
 it('excludes other workspaces',()=>{expect(canReadSutraConversation({...c,workspace:'production'},'baby-a','caregiver')).toBe(false);});
 it('uses morning, afternoon and evening greetings',()=>{expect(sutraGreeting(9)).toBe('Good morning');expect(sutraGreeting(14)).toBe('Good afternoon');expect(sutraGreeting(20)).toBe('Good evening');});
});
