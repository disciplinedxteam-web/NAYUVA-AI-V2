import { z } from 'zod';

/** One integration contract for a future Sarvam adapter. No provider is connected. */
export const svaraOutputSchema = z.object({
  category: z.string().min(1).max(100),
  caregiverQuote: z.string().min(1).max(3000),
  observation: z.enum(['Caregiver reported', 'Reduced', 'Not recorded']),
}).strict();
export const lekhaOutputSchema = z.object({
  clinicalObservations: z.string().max(5000),
  decision: z.string().max(5000),
  followUp: z.string().max(3000),
  additionalNote: z.string().max(3000),
}).strict();
export const productInstructions = {
  svara: 'Capture only the approved Care Plan categories. Preserve the caregiver quote. Never diagnose, assess medical risk, recommend treatment, or assign review priority. Return a draft for caregiver review.',
  milan: 'Extract only appointment date, time and reason from an explicit scheduling request. Never create or change an appointment without application validation and user confirmation.',
  lekha: 'Structure only the clinician’s stated observations, decision and follow-up. Never invent clinical information or make clinical decisions. Return editable draft documentation for clinician approval.',
};
export type SarvamAdapter = {
  transcribe: (audio: Blob, language: string) => Promise<string>;
  interpret: (context: keyof typeof productInstructions, transcript: string, approvedCategories: string[]) => Promise<unknown>;
};