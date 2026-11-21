import { useEffect } from 'react';
import { X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { lockScroll } from '@/lib/scroll-lock';

export type AvatarPhoto = { src: string; name: string };
export function AvatarPreview({ photo, onClose }: { photo: AvatarPhoto; onClose: () => void }) {
  useEffect(() => {
    const unlock = lockScroll();
    const close = (event: KeyboardEvent) => { if (event.key === 'Escape') onClose(); };
    window.addEventListener('keydown', close);
    return () => { unlock(); window.removeEventListener('keydown', close); };
  }, [onClose]);
  return <div className="avatar-preview-backdrop" onClick={onClose}>
    <section className="avatar-preview" role="dialog" aria-modal="true" aria-label={`${photo.name}'s profile photo`} onClick={e => e.stopPropagation()}>
      <Button autoFocus variant="secondary" size="icon" className="avatar-preview-close" aria-label="Close profile photo" onClick={onClose}><X /></Button>
      <img src={photo.src} alt={`${photo.name}'s profile photo`} />
      <h2>{photo.name}</h2>
    </section>
  </div>;
}