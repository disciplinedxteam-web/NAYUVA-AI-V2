import { useEffect, useLayoutEffect, useRef, useState } from 'react';
import { ChevronLeft, ChevronRight, Download, Loader2, PenLine, ShieldCheck, ZoomIn, ZoomOut, Check, Share2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { documentTopics, type CareCard } from '@/lib/care-card';

export type DocMeta = { babyName: string; caregiverName: string; dob?: string | undefined; gestation?: string | undefined; reason: string; when: string; clinician: string; kind?: 'encounter' | 'online' | 'svara' };
type Meta = DocMeta;
const FIRST = 5, NEXT = 8;
/** True A4 at 96 dpi; the on-screen sheet is this exact page scaled, so it matches the downloaded PDF. */
const A4_W = 794, A4_H = 1123;
/** Splits topics into fixed-capacity A4 sheets so no sheet ever scrolls. */
export function paginateTopics<T>(topics: T[]): T[][] {
  const pages: T[][] = [topics.slice(0, FIRST)];
  for (let i = FIRST; i < topics.length; i += NEXT) pages.push(topics.slice(i, i + NEXT));
  return pages;
}
type Indexed = CareCard['topics'][number] & { at: number };
/** Printable topics with their original index, concerns first, undiscussed placeholders removed. */
export function orderedTopics(card: CareCard): Indexed[] {
  const keep = new Set(documentTopics(card));
  const list = card.topics.map((t, at) => ({ ...t, at })).filter((t) => keep.has(card.topics[t.at]!));
  return [...list.filter((t) => t.status === 'Concern'), ...list.filter((t) => t.status !== 'Concern')];
}
const LABEL = { encounter: ['Clinical encounter note', 'In-person visit'], online: ['Clinical encounter note', 'Online consultation'], svara: ['Svara check-in report', 'Caregiver voice check-in'] } as const;

function Sheet({ meta, card, topics, index, total, approved, editing, onEdit }: { meta: Meta; card: CareCard; topics: Indexed[]; index: number; total: number; approved: boolean; editing?: boolean; onEdit?: ((i: number, v: string) => void) | undefined }) {
  const kind = meta.kind ?? 'encounter', svara = kind === 'svara', [title, mode] = LABEL[kind];
  const concerns = card.topics.filter((t) => t.status === 'Concern').map((t) => t.title);
  return <article className="lekha-a4" aria-label={`${title} page ${index + 1} of ${total}`}>
    <header className="lekha-a4-head"><div><img src="/favicon.png" alt="" onError={e => { e.currentTarget.style.display = 'none'; }} /><strong>Nayuva</strong><small>Newborn continuity of care</small></div><div><span>{title}</span><small>{mode} · {meta.when}</small></div></header>
    {index === 0 && <>
      <dl className="lekha-a4-meta">{[['Baby', meta.babyName], ['Caregiver', meta.caregiverName], ['Date of birth', meta.dob || '—'], ['Gestation', meta.gestation || '—'], [svara ? 'Check-in' : 'Visit reason', meta.reason], [svara ? 'Reviewed by' : 'Clinician', meta.clinician]].map(([k, v]) => <div key={k}><dt>{k}</dt><dd>{v}</dd></div>)}</dl>
      <div className={`lekha-a4-review is-${card.priority.split(' ')[0]?.toLowerCase()}`}><strong>{card.priority}</strong><span>{card.priorityReason || 'Suggested review category — confirm before signing.'}</span></div>
      {concerns.length > 0 && <div className="lekha-a4-concerns"><strong>Concerns raised</strong><span>{concerns.join(' · ')}</span></div>}
    </>}
    <section className="lekha-a4-body">
      {svara && topics.length > 0 && <div className="lekha-a4-thead"><span>Topic & structured finding</span><span>Caregiver’s own words</span></div>}
      {topics.map((t) => <div key={t.at} className={`lekha-a4-topic ${svara ? 'is-row' : ''}`}>
        <div className="lekha-a4-topic-main">
          <div><h3>{t.title}</h3>{t.status === 'Concern' && <span className="lekha-a4-status is-concern">Concern</span>}</div>
          {editing && onEdit && !approved ? <textarea rows={3} maxLength={1000} aria-label={`Edit ${t.title}`} value={t.finding} onChange={e => onEdit(t.at, e.target.value)} /> : <p>{t.finding}</p>}
        </div>
        {svara && <blockquote className="lekha-a4-quote">{t.quote ? `“${t.quote}”` : '—'}</blockquote>}
      </div>)}
      {index === total - 1 && card.summary && <div className="lekha-a4-summary"><h3>Summary</h3><p>{card.summary}</p></div>}
    </section>
    <footer className="lekha-a4-foot">{index === total - 1 ? <div className={`lekha-a4-sign ${approved ? 'signed' : ''}`}><ShieldCheck size={16} /><span>{approved ? (svara ? 'Confirmed for the care team' : `Approved by ${meta.clinician}`) : 'Awaiting approval'}</span></div> : <span />}<small>{svara ? 'Organised from the caregiver’s own words' : 'AI-organised from the consultation'} · Not a diagnosis · Page {index + 1} of {total}</small></footer>
  </article>;
}

export const docFileName = (meta: Meta) => `Nayuva-${meta.kind === 'svara' ? 'Svara-Report' : 'Encounter'}-${meta.babyName.replace(/[^\w-]+/g, '-')}.pdf`;

/** Renders every sheet off-screen so PDFs match the preview exactly. */
export function DocumentPdfRoot({ meta, card, approved, rootRef }: { meta: Meta; card: CareCard; approved: boolean; rootRef: React.RefObject<HTMLDivElement | null> }) {
  const pages = paginateTopics(orderedTopics(card));
  return <div ref={rootRef} className="lekha-pdf-root" aria-hidden="true">{pages.map((t, i) => <Sheet key={i} meta={meta} card={card} topics={t} index={i} total={pages.length} approved={approved} />)}</div>;
}
export async function buildPdf(root: HTMLElement | null): Promise<Blob> {
  const [{ jsPDF }, { default: html2canvas }] = await Promise.all([import('jspdf'), import('html2canvas-pro')]);
  const pdf = new jsPDF({ unit: 'mm', format: 'a4' });
  const sheets = Array.from(root?.querySelectorAll<HTMLElement>('.lekha-a4') ?? []);
  if (!sheets.length) throw new Error('Document is not ready yet.');
  for (const [i, sheet] of sheets.entries()) {
    const canvas = await html2canvas(sheet, { scale: 2, backgroundColor: '#ffffff', useCORS: true });
    if (i) pdf.addPage();
    pdf.addImage(canvas.toDataURL('image/jpeg', 0.95), 'JPEG', 0, 0, 210, 297);
  }
  return pdf.output('blob');
}
export function saveBlob(blob: Blob, name: string) {
  const url = URL.createObjectURL(blob); const a = document.createElement('a'); a.href = url; a.download = name; document.body.appendChild(a); a.click(); a.remove(); setTimeout(() => URL.revokeObjectURL(url), 2000);
}

export function LekhaDocument({ meta, card, approved, busy = false, onEdit, onApprove, approveLabel = 'Approve & Sign', onShare }: { meta: Meta; card: CareCard; approved: boolean; busy?: boolean; onEdit?: (i: number, v: string) => void; onApprove?: () => void; approveLabel?: string; onShare?: () => void }) {
  const all = orderedTopics(card); const pages = paginateTopics(all); const [page, setPage] = useState(0); const p = Math.min(page, pages.length - 1);
  const stage = useRef<HTMLDivElement>(null), pdfRoot = useRef<HTMLDivElement>(null);
  const [fit, setFit] = useState(0.6), [zoom, setZoom] = useState(1), [editing, setEditing] = useState(false), [saving, setSaving] = useState(false), [err, setErr] = useState('');
  useLayoutEffect(() => {
    const el = stage.current; if (!el) return;
    const measure = () => setFit(Math.max(0.3, Math.min((el.clientHeight - 8) / A4_H, (el.clientWidth - 8) / A4_W)));
    measure(); const ro = new ResizeObserver(measure); ro.observe(el); return () => ro.disconnect();
  }, []);
  useEffect(() => { const key = (e: KeyboardEvent) => { if ((e.target as HTMLElement).tagName === 'TEXTAREA') return; if (e.key === 'ArrowRight') setPage(x => Math.min(x + 1, pages.length - 1)); if (e.key === 'ArrowLeft') setPage(x => Math.max(x - 1, 0)); }; window.addEventListener('keydown', key); return () => window.removeEventListener('keydown', key); }, [pages.length]);
  const scale = fit * zoom;
  async function download() { setSaving(true); setErr(''); try { saveBlob(await buildPdf(pdfRoot.current), docFileName(meta)); } catch (e) { setErr(e instanceof Error ? e.message : 'PDF could not be created.'); } finally { setSaving(false); } }
  return <div className="lekha-doc-viewer">
    <div ref={stage} className="lekha-doc-stage">
      <div className="lekha-doc-frame" style={{ width: A4_W * scale, height: A4_H * scale }}>
        <div style={{ width: A4_W, height: A4_H, transform: `scale(${scale})`, transformOrigin: 'top left' }}>
          <Sheet meta={meta} card={card} topics={pages[p] ?? []} index={p} total={pages.length} approved={approved} editing={editing} onEdit={onEdit} />
        </div>
      </div>
    </div>
    <aside className="lekha-doc-dock" aria-label="Document controls">
      <div className="lekha-dock-group">
        <Button variant="ghost" size="icon" aria-label="Zoom in" disabled={zoom >= 1.6} onClick={() => setZoom(z => Math.min(1.6, +(z + 0.2).toFixed(1)))}><ZoomIn /></Button>
        <span className="lekha-dock-label">{Math.round(zoom * 100)}%</span>
        <Button variant="ghost" size="icon" aria-label="Zoom out" disabled={zoom <= 0.6} onClick={() => setZoom(z => Math.max(0.6, +(z - 0.2).toFixed(1)))}><ZoomOut /></Button>
      </div>
      <div className="lekha-dock-group">
        <Button variant="ghost" size="icon" aria-label="Previous page" disabled={p === 0} onClick={() => setPage(p - 1)}><ChevronLeft /></Button>
        <span className="lekha-dock-label">{p + 1} / {pages.length}</span>
        <Button variant="ghost" size="icon" aria-label="Next page" disabled={p >= pages.length - 1} onClick={() => setPage(p + 1)}><ChevronRight /></Button>
      </div>
      <div className="lekha-dock-group">
        {onEdit && <Button variant="ghost" size="icon" aria-label={editing ? 'Finish editing' : 'Edit document'} title={editing ? 'Finish editing' : 'Edit document'} aria-pressed={editing} className={editing ? 'is-on' : ''} disabled={approved} onClick={() => setEditing(v => !v)}>{editing ? <Check /> : <PenLine />}</Button>}
        <Button variant="ghost" size="icon" aria-label="Download PDF" title="Download PDF" disabled={saving} onClick={() => void download()}>{saving ? <Loader2 className="animate-spin" /> : <Download />}</Button>
        {onShare && <Button variant="ghost" size="icon" aria-label="Share PDF" title="Share PDF" onClick={onShare}><Share2 /></Button>}
      </div>
      {onApprove && <Button className="lekha-dock-approve" disabled={busy || approved} onClick={() => { setEditing(false); onApprove(); }}><ShieldCheck /><span>{approveLabel}</span></Button>}
      {err && <p role="alert" className="lekha-dock-error">{err}</p>}
    </aside>
    <DocumentPdfRoot meta={meta} card={card} approved={approved} rootRef={pdfRoot} />
  </div>;
}
