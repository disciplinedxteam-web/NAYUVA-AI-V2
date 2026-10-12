import { describe,it,expect } from 'vitest';
import { phoneInputSchema,pendingSvaraPriority } from '../lib/svara-session-domain';
describe('Svara call consent and review safety',()=>{
 it('requires explicit consent and an international destination',()=>{expect(phoneInputSchema.safeParse({phone:'+919876543210',consent:true}).success).toBe(true);expect(phoneInputSchema.safeParse({phone:'+919876543210',consent:false}).success).toBe(false);expect(phoneInputSchema.safeParse({phone:'9876543210',consent:true}).success).toBe(false);});
 it('keeps unapproved scoring pending review, never routine',()=>{expect(pendingSvaraPriority()).toEqual({priority:'Review Needed',workflowStatus:'Pending review',matchedRules:[],reason:'Clinician-approved trigger rules and complete validated question answers are required.'});});
});