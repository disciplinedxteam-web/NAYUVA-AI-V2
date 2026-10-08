import {describe,it,expect} from 'vitest';
import {workflowPriority,permittedCategory,scheduleHours,indiaTimestamp,planSchema,emptyPlan} from '../lib/care-domain';
describe('clinician-directed workflow rules',()=>{
 it('ordinary updates are Routine',()=>expect(workflowPriority('Caregiver reported')).toBe('Routine'));
 it('reduced observations request review, not medical risk',()=>expect(workflowPriority('Reduced')).toBe('Review Needed'));
 it('explicit attention requests use Priority Review',()=>expect(workflowPriority('Clinician attention requested')).toBe('Priority Review'));
 it('Svara rejects unapproved observation categories',()=>expect(permittedCategory(['Feeding'],'Temperature')).toBe(false));
 it('Svara accepts approved observations',()=>expect(permittedCategory(['Feeding'],'Feeding')).toBe(true));
 it('stores daily interval as 24 hours',()=>expect(scheduleHours('Daily')).toBe(24));
 it('stores twice daily as 12 hours',()=>expect(scheduleHours('Twice daily')).toBe(12));
 it('stores every 2 days as 48 hours',()=>expect(scheduleHours('Every 2 days')).toBe(48));
 it('stores weekly as 168 hours',()=>expect(scheduleHours('Weekly')).toBe(168));
 it('supports custom intervals',()=>expect(scheduleHours('Custom',3)).toBe(72));
 it('converts India appointment time correctly',()=>expect(indiaTimestamp('2026-10-12','10:30')).toBe('2026-10-12T05:00:00.000Z'));
 const valid={...emptyPlan,babyName:'Aarav Sharma',caregiverName:'Meera Sharma',dob:'2026-09-28',mobile:'9876543210',categories:['Feeding']};
 it('requires date and time together for follow-up',()=>expect(planSchema.safeParse({...valid,followupDate:'2026-10-12'}).success).toBe(false));
 it('requires structured medication details when medication is selected',()=>expect(planSchema.safeParse({...valid,takingMedication:'Yes',medications:[]}).success).toBe(false));
 it('rejects a plan with no approved categories',()=>expect(planSchema.safeParse({...valid,categories:[]}).success).toBe(false));
});
