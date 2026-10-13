import { parseCard, type CareCard } from '@/lib/care-card';

/** Renders a structured topic card; falls back to plain text for older summaries. */
export function TopicCards({ card, text, compact }: { card?: CareCard | null; text?: string | null; compact?: boolean }) {
  const c = card ?? parseCard(text);
  if (!c) return text ? <p className="text-sm whitespace-pre-line" data-no-translate>{text}</p> : null;
  return <div className="topic-cards" data-no-translate>
    {!compact && <div className="topic-cards-head"><span className={`topic-priority p-${c.priority.split(' ')[0]!.toLowerCase()}`}>{c.priority}</span>{c.priorityReason && <small>{c.priorityReason}</small>}</div>}
    <ul>{c.topics.map((t, i) => <li key={i} className={`topic-row s-${t.status.split(' ')[0]!.toLowerCase()}`}>
      <strong>{t.title}</strong><span>{t.finding || t.status}</span>
      {!compact && t.quote && <q>{t.quote}</q>}
    </li>)}</ul>
  </div>;
}
