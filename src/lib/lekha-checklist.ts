// Deterministic keyword detection for Lekha's optional documentation checklist (no AI judgement).
export type ChecklistItem = { key: string; title: string; hint: string; words: string[] };

export const lekhaChecklist: ChecklistItem[] = [
  { key: 'reason', title: 'Reason & main concern', hint: 'What the visit was about, onset and course', words: ['reason', 'visit', 'came in', 'came for', 'here for', 'appointment for', 'follow-up for', 'review of', 'started', 'since', 'began', 'onset', 'worse', 'better', 'improv', 'days ago', 'weeks ago', 'concern'] },
  { key: 'history', title: 'Updates & relevant history', hint: 'New symptoms, past illness or procedures', words: ['also', 'other symptom', 'additionally', 'new symptom', 'since last visit', 'apart from', 'history', 'previous', 'past', 'earlier', 'born', 'birth', 'nicu', 'preterm', 'premature', 'procedure', 'surgery'] },
  { key: 'medicines', title: 'Medicines & allergies', hint: 'Current medicines, adherence, allergies', words: ['medicine', 'medication', 'drops', 'syrup', 'dose', 'mg', 'ml', 'allerg', 'tablet', 'vitamin', 'antibiotic'] },
  { key: 'exam', title: 'Measurements & examination', hint: 'Vitals, weight and examination findings', words: ['weight', 'kg', 'gram', 'height', 'length', 'temperature', 'temp', 'heart rate', 'pulse', 'saturation', 'spo2', 'examin', 'cm', 'bilirubin'] },
  { key: 'reports', title: 'Reports & tests', hint: 'Results reviewed or tests planned', words: ['report', 'test', 'lab', 'scan', 'x-ray', 'ultrasound', 'blood', 'result', 'culture'] },
  { key: 'assessment', title: 'Findings & assessment', hint: "Clinician's professional assessment", words: ['assess', 'impression', 'diagnos', 'finding', 'appears', 'consistent with', 'normal', 'stable', 'within range'] },
  { key: 'treatment', title: 'Treatment & advice', hint: 'Decisions, instructions and caregiver questions', words: ['advise', 'advice', 'continue', 'start', 'stop', 'treat', 'prescrib', 'recommend', 'instruct', 'feed every', 'asked', 'question', 'worried', 'worry', 'mother said', 'parent', 'caregiver', 'concerned about'] },
  { key: 'next', title: 'Next steps & follow-up', hint: 'Referrals, follow-up and planned actions', words: ['follow up', 'follow-up', 'next visit', 'review in', 'refer', 'come back', 'return', 'next week', 'schedule'] },
  { key: 'files', title: 'Reports attached', hint: 'Scans, labs or prescriptions', words: [] },
];

export function detectChecklist(text: string, fileCount: number): Set<string> {
  const t = text.toLowerCase();
  const done = new Set<string>();
  for (const item of lekhaChecklist) if (item.words.some(w => t.includes(w))) done.add(item.key);
  if (fileCount > 0) done.add('files');
  return done;
}
