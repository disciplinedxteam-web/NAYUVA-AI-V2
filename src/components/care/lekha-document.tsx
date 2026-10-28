import { useState } from 'react';
import { ChevronLeft, ChevronRight, Download, ShieldCheck } from 'lucide-react';
import { Button } from '@/components/ui/button';
import type { CareCard } from '@/lib/care-card';

type Meta = { babyName: string; caregiverName: string; dob?: string; gestation?: string; reason: string; when: string; clinician: string };
const FIRST = 5, NEXT = 9;
/** Splits topics into fixed-capacity A4 sheets so no sheet ever scrolls. */
export function paginateTopics<T>(topics: T[]): T[][] {
  const pages: T[][] = [topics.slice(0, FIRST)];
  for (let i = FIRST; i < topics.length; i += NEXT) pages.push(topics.slice(i, i + NEXT));
  return pages;
}

function Sheet({ meta, card, topics, index, total, approved, onEdit, offset }: { meta: Meta; card: CareCard; topics: CareCard['topics']; index: number; total: number; approved: boolean; onEdit?: (i: number, v: string) => void; offset: number }) {
  return <article className="lekha-a4" aria-label={`Encounter document page ${index + 1} of ${total}`}>
    <header className="lekha-a4-head"><div><img src="/favicon.png" alt="" onError={e => { e.currentTarget.style.display = 'none'; }} /><strong>Nayuva</strong><small>Newborn continuity of care</small></div><div><span>Clinical encounter note</span><small>In-person visit · {meta.when}</small></div></header>
    {index === 0 && <>
      <dl className="lekha-a4-meta">{[['Baby', meta.babyName], ['Caregiver', meta.caregiverName], ['Date of birth', meta.dob || '—'], ['Gestation', meta.gestation || '—'], ['Visit reason', meta.reason], ['Clinician', meta.clinician]].map(([k, v]) => <div key={k}><dt>{k}</dt><dd>{v}</dd></div>)}</dl>
      <div className={`lekha-a4-review is-${card.priority.split(' ')[0]?.toLowerCase()}`}><strong>{card.priority}</strong><span>{card.priorityReason || 'Suggested review category — confirm before signing.'}</span></div>
    </>}
    <section className="lekha-a4-body">{topics.map((t, i) => <div key={offset + i} className="lekha-a4-topic">
      <div><h3>{t.title}</h3><span className={`lekha-a4-status is-${t.status.split(' ')[0]?.toLowerCase()}`}>{t.status}</span></div>
      {onEdit && !approved ? <textarea rows={2} maxLength={80} aria-label={`Edit ${t.title}`} value={t.finding} onChange={e => onEdit(offset + i, e.target.value)} /> : <p>{t.finding || 'Not discussed.'}</p>}
    </div>)}</section>
    <footer className="lekha-a4-foot">{index === total - 1 ? <div className={`lekha-a4-sign ${approved ? 'signed' : ''}`}><ShieldCheck size={16} /><span>{approved ? `Approved by ${meta.clinician}` : 'Awaiting clinician approval'}</span></div> : <span />}<small>AI-organised from the clinician’s own notes · Not a diagnosis · Page {index + 1} of {total}</small></footer>
  </article>;
}

export function LekhaDocument({ meta, card, approved, onEdit }: { meta: Meta; card: CareCard; approved: boolean; onEdit: (i: number, v: string) => void }) {
  const pages = paginateTopics(card.topics), [page, setPage] = useState(0), p = Math.min(page, pages.length - 1);
  const offset = p === 0 ? 0 : FIRST + (p - 1) * NEXT;
  return <div className="lekha-doc-viewer">
    <Button variant="outline" size="icon" className="lekha-doc-arrow" aria-label="Previous page" disabled={p === 0} onClick={() => setPage(p - 1)}><ChevronLeft /></Button>
    <div className="lekha-doc-stage"><Sheet meta={meta} card={card} topics={pages[p] ?? []} index={p} total={pages.length} approved={approved} onEdit={onEdit} offset={offset} /></div>
    <Button variant="outline" size="icon" className="lekha-doc-arrow" aria-label="Next page" disabled={p >= pages.length - 1} onClick={() => setPage(p + 1)}><ChevronRight /></Button>
    <div className="lekha-doc-tools"><span>Page {p + 1} of {pages.length}</span><Button variant="ghost" size="sm" onClick={() => window.print()}><Download />Download</Button></div>
    <div className="lekha-print-root" aria-hidden="true">{pages.map((t, i) => <Sheet key={i} meta={meta} card={card} topics={t} index={i} total={pages.length} approved={approved} offset={i === 0 ? 0 : FIRST + (i - 1) * NEXT} />)}</div>
  </div>;
}
