import { describe,it,expect } from 'vitest';
import { phoneInputSchema,pendingSvaraPriority,reviewedSvaraSummary } from '../lib/svara-session-domain';
describe('Svara call consent and review safety',()=>{
 it('requires explicit consent and an international destination',()=>{expect(phoneInputSchema.safeParse({phone:'+919876543210',consent:true}).success).toBe(true);expect(phoneInputSchema.safeParse({phone:'+919876543210',consent:false}).success).toBe(false);expect(phoneInputSchema.safeParse({phone:'9876543210',consent:true}).success).toBe(false);});
 it('keeps unapproved scoring pending review, never routine',()=>{expect(pendingSvaraPriority()).toEqual({priority:'Review Needed',workflowStatus:'Pending review',matchedRules:[],reason:'Clinician-approved trigger rules and complete validated question answers are required.'});});
 it('sends caregiver-edited findings while preserving original statements and categories',()=>{
  const original={topics:[{title:'Feeding',finding:'Fed four times',status:'Concern',quote:'four feeds'}],priority:'Review Needed',priorityReason:'Caregiver change',summary:'Reported feeding change'};
  const edited={...original,topics:[{...original.topics[0],finding:'Fed five times',quote:'replaced quote',status:'Normal'}],priority:'Routine'};
  const saved=JSON.parse(reviewedSvaraSummary(JSON.stringify(original),JSON.stringify(edited)));
  expect(saved.topics[0]).toEqual({...original.topics[0],finding:'Fed five times'});
  expect(saved.priority).toBe('Review Needed');
 });
 it('cannot approve without a generated draft',()=>{expect(()=>reviewedSvaraSummary(null,'{}')).toThrow();});
 it('does not let review introduce unasked topics',()=>{
  const original={topics:[{title:'Feeding',finding:'Four feeds',status:'Normal',quote:'four'}],priority:'Routine'};
  expect(()=>reviewedSvaraSummary(JSON.stringify(original),JSON.stringify({...original,topics:[{...original.topics[0],title:'Breathing'}]}))).toThrow();
 });
});