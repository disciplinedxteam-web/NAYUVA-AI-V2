import { z } from 'zod';
export const phoneInputSchema = z.object({phone:z.string().trim().regex(/^\+[1-9]\d{7,14}$/,'Use an international phone number, for example +91 followed by your number'),consent:z.literal(true)});
export const transcriptSchema = z.array(z.object({role:z.enum(['user','bot']),content:z.string().min(1).max(6000)})).max(200);
export const svaraSummarySchema = z.object({summary:z.string().min(1).max(5000),observations:z.array(z.string().max(1000)).max(30),missingInformation:z.array(z.string().max(500)).max(30)}).strict();
/** No clinician-approved rule engine is installed. Never silently assign Routine. */
export function pendingSvaraPriority(){return {priority:'Review Needed',workflowStatus:'Pending review',matchedRules:[] as string[],reason:'Clinician-approved trigger rules and complete validated question answers are required.'};}