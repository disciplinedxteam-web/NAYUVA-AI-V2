import { z } from 'zod';

/** Structured topic card shared by Svara Health Cards and Lekha documentation. Browser-safe. */
export const PRIORITIES = ['Priority Review', 'Review Needed', 'Routine'] as const;
export type CardPriority = (typeof PRIORITIES)[number];
export const TOPIC_STATUSES = ['Normal', 'Concern', 'Not discussed'] as const;

export const topicSchema = z.object({
  title: z.string().trim().min(1).max(60),
  finding: z.string().trim().max(80),
  status: z.enum(TOPIC_STATUSES),
  quote: z.string().max(400).default(''),
});
export const careCardSchema = z.object({
  topics: z.array(topicSchema).min(1).max(20),
  priority: z.enum(PRIORITIES),
  priorityReason: z.string().max(200).default(''),
});
export type CareTopic = z.infer<typeof topicSchema>;
export type CareCard = z.infer<typeof careCardSchema>;

const str = (v: unknown, max: number) => (typeof v === 'string' ? v.trim().slice(0, max) : '');
function status(v: unknown): CareTopic['status'] {
  const s = str(v, 30).toLowerCase();
  if (s.startsWith('concern')) return 'Concern';
  if (s.startsWith('normal') || s === 'ok') return 'Normal';
  return 'Not discussed';
}
function priority(v: unknown): CardPriority {
  const s = str(v, 40).toLowerCase();
  if (s.startsWith('priority')) return 'Priority Review';
  if (s.startsWith('routine')) return 'Routine';
  // Missing or unrecognised never becomes Routine.
  return 'Review Needed';
}

/** Coerce an LLM reply into a safe card. Throws if no topics are present. */
export function normalizeCard(raw: unknown): CareCard {
  const o = (raw ?? {}) as Record<string, unknown>;
  const topics = (Array.isArray(o['topics']) ? o['topics'] : [])
    .map((t) => {
      const x = (t ?? {}) as Record<string, unknown>;
      return { title: str(x['title'], 60), finding: str(x['finding'] ?? x['highlight'], 80), status: status(x['status']), quote: str(x['quote'], 400) };
    })
    .filter((t) => t.title)
    .slice(0, 20);
  let p = priority(o['priority']);
  // A Routine card cannot contain a flagged concern.
  if (p === 'Routine' && topics.some((t) => t.status !== 'Normal')) p = 'Review Needed';
  return careCardSchema.parse({ topics, priority: p, priorityReason: str(o['priorityReason'] ?? o['priority_reason'], 200) });
}

/** Read a stored card (JSON string). Returns null for older plain-text summaries. */
export function parseCard(text: string | null | undefined): CareCard | null {
  if (!text || text[0] !== '{') return null;
  try { const r = careCardSchema.safeParse(JSON.parse(text)); return r.success ? r.data : null; } catch { return null; }
}

export const cardText = (c: CareCard) => c.topics.map((t) => `${t.title}: ${t.finding || t.status}`).join('\n');
