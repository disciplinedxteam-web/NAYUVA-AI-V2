import { useEffect, useRef, useState } from 'react';
import { Download, Eye, Loader2, Mail, MessageCircle, Share2, Link2, Check } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import type { CareCard } from '@/lib/care-card';
import { DocumentPdfRoot, LekhaDocument, buildPdf, docFileName, saveBlob, type DocMeta } from './lekha-document';

type Job = 'download' | 'share' | null;

/**
 * View / Download / Share icons for a documented record. Share hands the actual
 * PDF to the device share sheet (WhatsApp, Mail, etc.) when supported; otherwise
 * it downloads the PDF and opens WhatsApp or email so the file can be attached.
 * Older records without a stored document show disabled icons.
 */
export function DocumentActions({ meta, card, label = 'Documented' }: { meta: DocMeta; card: CareCard | null; label?: string }) {
  const [view, setView] = useState(false), [shareOpen, setShareOpen] = useState(false), [job, setJob] = useState<Job>(null), [msg, setMsg] = useState('');
  const root = useRef<HTMLDivElement>(null), blob = useRef<Blob | null>(null);
  const name = docFileName(meta);
  async function pdf() { if (!blob.current) blob.current = await buildPdf(root.current); return blob.current; }
  useEffect(() => {
    if (job !== 'download') return;
    let off = false;
    void (async () => { try { saveBlob(await pdf(), name); } catch (e) { if (!off) setMsg(e instanceof Error ? e.message : 'PDF could not be created.'); } finally { if (!off) setJob(null); } })();
    return () => { off = true; };
  }, [job]);
  const text = `${meta.kind === 'svara' ? 'Svara check-in report' : 'Consultation record'} for ${meta.babyName} (${meta.when}) from Nayuva.`;
  const file = async () => new File([await pdf()], name, { type: 'application/pdf' });
  async function nativeShare() {
    setJob('share'); setMsg('');
    try {
      await new Promise(r => setTimeout(r, 30));
      const f = await file();
      if (navigator.canShare?.({ files: [f] })) { await navigator.share({ files: [f], title: name, text }); setShareOpen(false); }
      else { saveBlob(f, name); setMsg('This device can’t share files directly, so the PDF was downloaded — attach it in any app.'); }
    } catch (e) { if ((e as Error).name !== 'AbortError') setMsg('Sharing was not completed.'); } finally { setJob(null); }
  }
  async function via(app: 'whatsapp' | 'email') {
    setJob('share'); setMsg('');
    try {
      const f = await file();
      if (navigator.canShare?.({ files: [f] })) { await navigator.share({ files: [f], title: name, text }); setShareOpen(false); return; }
      saveBlob(f, name);
      const body = `${text}\nThe PDF "${name}" is attached.`;
      window.open(app === 'whatsapp' ? `https://wa.me/?text=${encodeURIComponent(body)}` : `mailto:?subject=${encodeURIComponent(`Nayuva — ${meta.babyName}`)}&body=${encodeURIComponent(body)}`, '_blank', 'noopener');
      setMsg(`PDF downloaded. Attach "${name}" in ${app === 'whatsapp' ? 'WhatsApp' : 'your email'} to send it.`);
    } catch (e) { if ((e as Error).name !== 'AbortError') setMsg('Sharing was not completed.'); } finally { setJob(null); }
  }
  const none = !card, tip = 'No document exists for this older record';
  return <div className="doc-actions">
    <span className="doc-pill"><Check size={13} aria-hidden="true" />{label}</span>
    <div className="doc-icons">
      <Button type="button" variant="ghost" size="icon" aria-label="View document" title={none ? tip : 'View document'} disabled={none} onClick={() => setView(true)}><Eye /></Button>
      <Button type="button" variant="ghost" size="icon" aria-label="Download PDF" title={none ? tip : 'Download PDF'} disabled={none || !!job} onClick={() => { setMsg(''); setJob('download'); }}>{job === 'download' ? <Loader2 className="animate-spin" /> : <Download />}</Button>
      <Button type="button" variant="ghost" size="icon" aria-label="Share PDF" title={none ? tip : 'Share PDF'} disabled={none} onClick={() => { setMsg(''); setShareOpen(true); }}><Share2 /></Button>
    </div>
    {msg && !shareOpen && <p className="doc-msg" role="status">{msg}</p>}
    {card && <>
      <DocumentPdfRoot meta={meta} card={card} approved rootRef={root} />
      <Dialog open={view} onOpenChange={setView}>
        <DialogContent className="doc-view-dialog"><DialogHeader className="sr-only"><DialogTitle>{name}</DialogTitle><DialogDescription>Document preview</DialogDescription></DialogHeader>
          <LekhaDocument meta={meta} card={card} approved onShare={() => setShareOpen(true)} />
        </DialogContent>
      </Dialog>
      <Dialog open={shareOpen} onOpenChange={setShareOpen}>
        <DialogContent className="doc-share-dialog">
          <DialogHeader><DialogTitle>Share PDF</DialogTitle><DialogDescription>Send the {meta.kind === 'svara' ? 'report' : 'consultation record'} for {meta.babyName} as a PDF.</DialogDescription></DialogHeader>
          <div className="doc-share-grid">
            <Button type="button" variant="outline" disabled={!!job} onClick={() => void via('whatsapp')}><MessageCircle />WhatsApp</Button>
            <Button type="button" variant="outline" disabled={!!job} onClick={() => void via('email')}><Mail />Email</Button>
            <Button type="button" variant="outline" disabled={!!job} onClick={() => void nativeShare()}>{job === 'share' ? <Loader2 className="animate-spin" /> : <Link2 />}More apps</Button>
          </div>
          {msg && <p className="doc-msg" role="status">{msg}</p>}
        </DialogContent>
      </Dialog>
    </>}
  </div>;
}
