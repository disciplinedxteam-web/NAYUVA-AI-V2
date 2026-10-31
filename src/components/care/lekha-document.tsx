import { useEffect, useLayoutEffect, useRef, useState } from 'react';
import { ChevronDown, ChevronLeft, ChevronRight, ChevronUp, Download, Loader2, PenLine, Search, ShieldCheck, ZoomIn, ZoomOut, Check, Share2, X } from 'lucide-react';
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

const ZOOMS = [0.5, 0.75, 1, 1.25, 1.5, 2] as const;
type ZoomMode = 'fit' | (typeof ZOOMS)[number];

/** Highlights search matches inside the viewer with the CSS Custom Highlight API (no DOM mutation). */
function paintMatches(root: HTMLElement | null, query: string, active: number): Range[] {
  const reg = (globalThis as { CSS?: { highlights?: Map<string, unknown> } }).CSS?.highlights;
  const H = (globalThis as { Highlight?: new (...r: Range[]) => unknown }).Highlight;
  reg?.delete('doc-match'); reg?.delete('doc-match-active');
  const q = query.trim().toLowerCase(); if (!root || !q) return [];
  const ranges: Range[] = []; const walk = document.createTreeWalker(root, NodeFilter.SHOW_TEXT);
  for (let n = walk.nextNode(); n; n = walk.nextNode()) {
    const text = n.textContent?.toLowerCase() ?? ''; let i = text.indexOf(q);
    while (i >= 0) { const r = document.createRange(); r.setStart(n, i); r.setEnd(n, i + q.length); ranges.push(r); i = text.indexOf(q, i + q.length); }
  }
  if (reg && H) { reg.set('doc-match', new H(...ranges)); const a = ranges[active]; if (a) reg.set('doc-match-active', new H(a)); }
  return ranges;
}

export function LekhaDocument({ meta, card, approved, busy = false, onEdit, onApprove, approveLabel = 'Approve & Sign', onShare }: { meta: Meta; card: CareCard; approved: boolean; busy?: boolean; onEdit?: (i: number, v: string) => void; onApprove?: () => void; approveLabel?: string; onShare?: () => void }) {
  const pages = paginateTopics(orderedTopics(card));
  const stage = useRef<HTMLDivElement>(null), pdfRoot = useRef<HTMLDivElement>(null), searchInput = useRef<HTMLInputElement>(null);
  const [fit, setFit] = useState(0.8), [mode, setMode] = useState<ZoomMode>('fit'), [page, setPage] = useState(0);
  const [editing, setEditing] = useState(false), [saving, setSaving] = useState(false), [err, setErr] = useState('');
  const [searchOpen, setSearchOpen] = useState(false), [query, setQuery] = useState(''), [hit, setHit] = useState(0), [hits, setHits] = useState(0);
  const scale = mode === 'fit' ? fit : mode;
  useLayoutEffect(() => {
    const el = stage.current; if (!el) return;
    const measure = () => setFit(Math.max(0.35, Math.min(1, (el.clientWidth - 48) / A4_W)));
    measure(); const ro = new ResizeObserver(measure); ro.observe(el); return () => ro.disconnect();
  }, []);
  const sheets = () => Array.from(stage.current?.querySelectorAll<HTMLElement>('.lekha-doc-frame') ?? []);
  const goTo = (i: number) => { const s = sheets()[i]; if (s && stage.current) stage.current.scrollTo({ top: s.offsetTop - 16, behavior: 'smooth' }); setPage(i); };
  function onScroll() {
    const el = stage.current; if (!el) return; const mid = el.scrollTop + el.clientHeight / 3;
    let cur = 0; sheets().forEach((s, i) => { if (s.offsetTop <= mid) cur = i; }); setPage(cur);
  }
  useEffect(() => {
    const ranges = paintMatches(stage.current, searchOpen ? query : '', hit); setHits(ranges.length);
    const a = ranges[hit]; if (a) { const box = a.getBoundingClientRect(), host = stage.current!.getBoundingClientRect(); if (box.top < host.top || box.bottom > host.bottom) stage.current!.scrollBy({ top: box.top - host.top - host.height / 3, behavior: 'smooth' }); }
  }, [query, hit, searchOpen, scale, card, editing]);
  useEffect(() => () => { paintMatches(null, '', 0); }, []);
  useEffect(() => { if (searchOpen) searchInput.current?.focus(); }, [searchOpen]);
  const step = (d: 1 | -1) => { const i = ZOOMS.findIndex(z => z >= scale - 0.001); const next = d > 0 ? ZOOMS.find(z => z > scale + 0.001) : [...ZOOMS].reverse().find(z => z < scale - 0.001); setMode(next ?? (d > 0 ? ZOOMS[ZOOMS.length - 1]! : ZOOMS[0]!)); void i; };
  async function download() { setSaving(true); setErr(''); try { saveBlob(await buildPdf(pdfRoot.current), docFileName(meta)); } catch (e) { setErr(e instanceof Error ? e.message : 'PDF could not be created.'); } finally { setSaving(false); } }
  async function share() {
    if (onShare) return onShare();
    setSaving(true); setErr('');
    try { const f = new File([await buildPdf(pdfRoot.current)], docFileName(meta), { type: 'application/pdf' }); if (navigator.canShare?.({ files: [f] })) await navigator.share({ files: [f], title: f.name }); else { saveBlob(f, f.name); setErr('Sharing isn’t supported here, so the PDF was downloaded.'); } }
    catch (e) { if ((e as Error).name !== 'AbortError') setErr('Sharing was not completed.'); } finally { setSaving(false); }
  }
  const review = !!onApprove;
  return <div className="lekha-doc-viewer">
    <div className="doc-toolbar" role="toolbar" aria-label="Document controls">
      <div className="doc-tool-group">
        <Button variant="ghost" size="icon" aria-label="Previous page" title="Previous page" disabled={page === 0} onClick={() => goTo(page - 1)}><ChevronLeft /></Button>
        <span className="doc-tool-label">Page <b>{page + 1}</b> of {pages.length}</span>
        <Button variant="ghost" size="icon" aria-label="Next page" title="Next page" disabled={page >= pages.length - 1} onClick={() => goTo(page + 1)}><ChevronRight /></Button>
      </div>
      <div className="doc-tool-group">
        <Button variant="ghost" size="icon" aria-label="Zoom out" title="Zoom out" disabled={scale <= ZOOMS[0] + 0.001} onClick={() => step(-1)}><ZoomOut /></Button>
        <select className="doc-zoom-select" aria-label="Zoom level" value={String(mode)} onChange={e => setMode(e.target.value === 'fit' ? 'fit' : Number(e.target.value) as ZoomMode)}>
          <option value="fit">Fit width{mode === 'fit' ? ` · ${Math.round(fit * 100)}%` : ''}</option>
          {ZOOMS.map(z => <option key={z} value={String(z)}>{Math.round(z * 100)}%</option>)}
        </select>
        <Button variant="ghost" size="icon" aria-label="Zoom in" title="Zoom in" disabled={scale >= ZOOMS[ZOOMS.length - 1]! - 0.001} onClick={() => step(1)}><ZoomIn /></Button>
        <span className="doc-tool-sep" aria-hidden="true" />
        {searchOpen ? <div className="doc-search">
          <Search size={15} aria-hidden="true" />
          <input ref={searchInput} aria-label="Search document" placeholder="Search" value={query} onChange={e => { setQuery(e.target.value); setHit(0); }} onKeyDown={e => { if (e.key === 'Enter' && hits) setHit(h => (h + (e.shiftKey ? hits - 1 : 1)) % hits); if (e.key === 'Escape') { setSearchOpen(false); setQuery(''); } }} />
          <span className="doc-tool-label">{query.trim() ? `${hits ? hit + 1 : 0}/${hits}` : ''}</span>
          <Button variant="ghost" size="icon" aria-label="Previous match" disabled={!hits} onClick={() => setHit(h => (h + hits - 1) % hits)}><ChevronUp /></Button>
          <Button variant="ghost" size="icon" aria-label="Next match" disabled={!hits} onClick={() => setHit(h => (h + 1) % hits)}><ChevronDown /></Button>
          <Button variant="ghost" size="icon" aria-label="Close search" onClick={() => { setSearchOpen(false); setQuery(''); }}><X /></Button>
        </div> : <Button variant="ghost" size="icon" aria-label="Search document" title="Search" onClick={() => setSearchOpen(true)}><Search /></Button>}
      </div>
      <div className="doc-tool-group is-actions">
        <Button variant="ghost" size="icon" aria-label="Download PDF" title="Download PDF" disabled={saving} onClick={() => void download()}>{saving ? <Loader2 className="animate-spin" /> : <Download />}</Button>
        <Button variant="ghost" size="icon" aria-label="Share PDF" title="Share PDF" disabled={saving} onClick={() => void share()}><Share2 /></Button>
        {review && onEdit && <Button variant="outline" size="sm" className={`doc-edit-btn ${editing ? 'is-on' : ''}`} aria-pressed={editing} disabled={approved} onClick={() => setEditing(v => !v)}>{editing ? <Check /> : <PenLine />}{editing ? 'Done' : 'Edit'}</Button>}
        {review && <Button size="sm" className="doc-approve-btn" disabled={busy || approved} onClick={() => { setEditing(false); onApprove?.(); }}>{busy ? <Loader2 className="animate-spin" /> : <ShieldCheck />}{approveLabel}</Button>}
      </div>
    </div>
    {err && <p role="alert" className="doc-tool-error">{err}</p>}
    <div ref={stage} className="lekha-doc-stage" onScroll={onScroll}>
      {pages.map((t, i) => <div key={i} className="lekha-doc-frame" style={{ width: A4_W * scale, height: A4_H * scale }}>
        <div style={{ width: A4_W, height: A4_H, transform: `scale(${scale})`, transformOrigin: 'top left' }}>
          <Sheet meta={meta} card={card} topics={t} index={i} total={pages.length} approved={approved} editing={editing && review} onEdit={review ? onEdit : undefined} />
        </div>
      </div>)}
    </div>
    <DocumentPdfRoot meta={meta} card={card} approved={approved} rootRef={pdfRoot} />
  </div>;
}
