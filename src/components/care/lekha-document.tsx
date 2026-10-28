import { useEffect, useLayoutEffect, useRef, useState } from 'react';
import { ChevronLeft, ChevronRight, Download, Loader2, PenLine, ShieldCheck, ZoomIn, ZoomOut, Check } from 'lucide-react';
import { Button } from '@/components/ui/button';
import type { CareCard } from '@/lib/care-card';

type Meta = { babyName: string; caregiverName: string; dob?: string | undefined; gestation?: string | undefined; reason: string; when: string; clinician: string };
const FIRST = 5, NEXT = 9;
/** True A4 at 96 dpi; the on-screen sheet is this exact page scaled, so it matches the downloaded PDF. */
const A4_W = 794, A4_H = 1123;
/** Splits topics into fixed-capacity A4 sheets so no sheet ever scrolls. */
export function paginateTopics<T>(topics: T[]): T[][] {
  const pages: T[][] = [topics.slice(0, FIRST)];
  for (let i = FIRST; i < topics.length; i += NEXT) pages.push(topics.slice(i, i + NEXT));
  return pages;
}

function Sheet({ meta, card, topics, index, total, approved, editing, onEdit, offset }: { meta: Meta; card: CareCard; topics: CareCard['topics']; index: number; total: number; approved: boolean; editing?: boolean; onEdit?: (i: number, v: string) => void; offset: number }) {
  return <article className="lekha-a4" aria-label={`Encounter document page ${index + 1} of ${total}`}>
    <header className="lekha-a4-head"><div><img src="/favicon.png" alt="" onError={e => { e.currentTarget.style.display = 'none'; }} /><strong>Nayuva</strong><small>Newborn continuity of care</small></div><div><span>Clinical encounter note</span><small>In-person visit · {meta.when}</small></div></header>
    {index === 0 && <>
      <dl className="lekha-a4-meta">{[['Baby', meta.babyName], ['Caregiver', meta.caregiverName], ['Date of birth', meta.dob || '—'], ['Gestation', meta.gestation || '—'], ['Visit reason', meta.reason], ['Clinician', meta.clinician]].map(([k, v]) => <div key={k}><dt>{k}</dt><dd>{v}</dd></div>)}</dl>
      <div className={`lekha-a4-review is-${card.priority.split(' ')[0]?.toLowerCase()}`}><strong>{card.priority}</strong><span>{card.priorityReason || 'Suggested review category — confirm before signing.'}</span></div>
    </>}
    <section className="lekha-a4-body">{topics.map((t, i) => <div key={offset + i} className="lekha-a4-topic">
      <div><h3>{t.title}</h3><span className={`lekha-a4-status is-${t.status.split(' ')[0]?.toLowerCase()}`}>{t.status}</span></div>
      {editing && onEdit && !approved ? <textarea rows={3} maxLength={400} aria-label={`Edit ${t.title}`} value={t.finding} onChange={e => onEdit(offset + i, e.target.value)} /> : <p>{t.finding || 'Not discussed.'}</p>}
    </div>)}</section>
    <footer className="lekha-a4-foot">{index === total - 1 ? <div className={`lekha-a4-sign ${approved ? 'signed' : ''}`}><ShieldCheck size={16} /><span>{approved ? `Approved by ${meta.clinician}` : 'Awaiting clinician approval'}</span></div> : <span />}<small>AI-organised from the clinician’s own notes · Not a diagnosis · Page {index + 1} of {total}</small></footer>
  </article>;
}

export function LekhaDocument({ meta, card, approved, busy = false, onEdit, onApprove }: { meta: Meta; card: CareCard; approved: boolean; busy?: boolean; onEdit: (i: number, v: string) => void; onApprove?: () => void }) {
  const pages = paginateTopics(card.topics); const [page, setPage] = useState(0); const p = Math.min(page, pages.length - 1);
  const offset = p === 0 ? 0 : FIRST + (p - 1) * NEXT;
  const stage = useRef<HTMLDivElement>(null), pdfRoot = useRef<HTMLDivElement>(null);
  const [fit, setFit] = useState(0.6), [zoom, setZoom] = useState(1), [editing, setEditing] = useState(false), [saving, setSaving] = useState(false);
  useLayoutEffect(() => {
    const el = stage.current; if (!el) return;
    const measure = () => setFit(Math.max(0.3, Math.min((el.clientHeight - 8) / A4_H, (el.clientWidth - 8) / A4_W)));
    measure(); const ro = new ResizeObserver(measure); ro.observe(el); return () => ro.disconnect();
  }, []);
  useEffect(() => { const key = (e: KeyboardEvent) => { if ((e.target as HTMLElement).tagName === 'TEXTAREA') return; if (e.key === 'ArrowRight') setPage(x => Math.min(x + 1, pages.length - 1)); if (e.key === 'ArrowLeft') setPage(x => Math.max(x - 1, 0)); }; window.addEventListener('keydown', key); return () => window.removeEventListener('keydown', key); }, [pages.length]);
  const scale = fit * zoom;
  async function download() {
    setSaving(true);
    try {
      const [{ jsPDF }, { default: html2canvas }] = await Promise.all([import('jspdf'), import('html2canvas-pro')]);
      const pdf = new jsPDF({ unit: 'mm', format: 'a4' });
      const sheets = Array.from(pdfRoot.current?.querySelectorAll<HTMLElement>('.lekha-a4') ?? []);
      for (const [i, sheet] of sheets.entries()) {
        const canvas = await html2canvas(sheet, { scale: 2, backgroundColor: '#ffffff', useCORS: true });
        if (i) pdf.addPage();
        pdf.addImage(canvas.toDataURL('image/jpeg', 0.95), 'JPEG', 0, 0, 210, 297);
      }
      pdf.save(`Nayuva-Encounter-${meta.babyName.replace(/[^\w-]+/g, '-')}.pdf`);
    } finally { setSaving(false); }
  }
  return <div className="lekha-doc-viewer">
    <div ref={stage} className="lekha-doc-stage">
      <div className="lekha-doc-frame" style={{ width: A4_W * scale, height: A4_H * scale }}>
        <div style={{ width: A4_W, height: A4_H, transform: `scale(${scale})`, transformOrigin: 'top left' }}>
          <Sheet meta={meta} card={card} topics={pages[p] ?? []} index={p} total={pages.length} approved={approved} editing={editing} onEdit={onEdit} offset={offset} />
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
        <Button variant="ghost" size="icon" aria-label={editing ? 'Finish editing' : 'Edit document'} title={editing ? 'Finish editing' : 'Edit document'} aria-pressed={editing} className={editing ? 'is-on' : ''} disabled={approved} onClick={() => setEditing(v => !v)}>{editing ? <Check /> : <PenLine />}</Button>
        <Button variant="ghost" size="icon" aria-label="Download PDF" title="Download PDF" disabled={saving} onClick={() => void download()}>{saving ? <Loader2 className="animate-spin" /> : <Download />}</Button>
      </div>
      {onApprove && <Button className="lekha-dock-approve" disabled={busy || approved} onClick={() => { setEditing(false); onApprove(); }}><ShieldCheck /><span>Approve & Sign</span></Button>}
    </aside>
    <div ref={pdfRoot} className="lekha-pdf-root" aria-hidden="true">{pages.map((t, i) => <Sheet key={i} meta={meta} card={card} topics={t} index={i} total={pages.length} approved={approved} offset={i === 0 ? 0 : FIRST + (i - 1) * NEXT} />)}</div>
  </div>;
}
