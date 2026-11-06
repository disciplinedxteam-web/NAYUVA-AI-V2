import { useEffect, useState } from 'react';
import { Camera, Check, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { GlassToggle } from '@/components/ui/glass-toggle';

// Profile presentation preferences are saved in this browser only; they never change care records.
type Prefs = { photo: string; name: string; relationship: string; designation: string; registration: string; reminders: string };
const key = (role: string) => `nayuva-profile-${role}`;
const EVENT = 'nayuva-profile-change';
function read(role: string): Partial<Prefs> { try { return JSON.parse(localStorage.getItem(key(role)) ?? '{}') as Partial<Prefs>; } catch { return {}; } }

export function useProfilePhoto(role: string) {
  const [photo, setPhoto] = useState('');
  useEffect(() => { const sync = () => setPhoto(read(role).photo ?? ''); sync(); window.addEventListener(EVENT, sync); return () => window.removeEventListener(EVENT, sync); }, [role]);
  return photo;
}

function resize(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const img = new Image(); const url = URL.createObjectURL(file);
    img.onload = () => { const c = document.createElement('canvas'); const s = 256; c.width = c.height = s; const r = Math.min(img.width, img.height);
      c.getContext('2d')!.drawImage(img, (img.width - r) / 2, (img.height - r) / 2, r, r, 0, 0, s, s); URL.revokeObjectURL(url); resolve(c.toDataURL('image/jpeg', 0.85)); };
    img.onerror = () => { URL.revokeObjectURL(url); reject(new Error('Unable to read this image.')); };
    img.src = url;
  });
}

export function ProfileSettings({ role, defaultName, relationship }: { role: string; defaultName: string; relationship?: string | undefined }) {
  const team = role === 'care-team';
  const [p, setP] = useState<Prefs>({ photo: '', name: defaultName, relationship: relationship ?? 'Mother', designation: 'Paediatrician', registration: '', reminders: 'WhatsApp' });
  const [saved, setSaved] = useState(false); const [error, setError] = useState('');
  useEffect(() => { setP(v => ({ ...v, ...read(role) })); }, [role]);
  const set = (k: keyof Prefs, v: string) => { setSaved(false); setP(x => ({ ...x, [k]: v })); };
  const save = () => { localStorage.setItem(key(role), JSON.stringify(p)); window.dispatchEvent(new Event(EVENT)); setSaved(true); };
  const initials = p.name.split(' ').filter(w => !w.endsWith('.')).map(w => w[0]).join('').slice(0, 2).toUpperCase();

  return <section className="profile-settings">
    <div className="ps-photo">
      {p.photo ? <img src={p.photo} alt="Profile" /> : <span>{initials}</span>}
      <div><h2>{p.name || defaultName}</h2><p>{team ? p.designation : `${p.relationship} · Caregiver`}</p>
        <div className="ps-photo-actions">
          <label className="ps-upload"><Camera />Upload photo<input type="file" accept="image/*" hidden onChange={async e => { const f = e.target.files?.[0]; if (!f) return; try { setError(''); set('photo', await resize(f)); } catch (x) { setError((x as Error).message); } }} /></label>
          {p.photo && <Button variant="ghost" size="sm" onClick={() => set('photo', '')}><Trash2 />Remove</Button>}
        </div>{error && <p role="alert" className="text-xs text-destructive">{error}</p>}</div>
    </div>
    <div className="ps-grid">
      <label className="care-field"><span>Display name</span><input value={p.name} onChange={e => set('name', e.target.value)} maxLength={80} /></label>
      {team ? <>
        <label className="care-field"><span>Designation</span><select value={p.designation} onChange={e => set('designation', e.target.value)}>{['Paediatrician', 'Neonatologist', 'Nurse', 'Care coordinator'].map(o => <option key={o}>{o}</option>)}</select></label>
        <label className="care-field"><span>Registration number</span><input value={p.registration} onChange={e => set('registration', e.target.value)} maxLength={40} placeholder="Optional" /></label>
      </> : <div className="care-field"><span>Relationship to baby</span><GlassToggle value={p.relationship} onChange={v => set('relationship', v)} options={['Mother', 'Father', 'Guardian', 'Other'].map(k => ({ key: k, label: k }))} /></div>}
      {!team && <div className="care-field"><span>Check-in reminders</span><GlassToggle value={p.reminders} onChange={v => set('reminders', v)} options={['WhatsApp', 'SMS', 'Off'].map(k => ({ key: k, label: k }))} /></div>}
    </div>
    <div className="ps-footer"><small>Photo and display preferences are saved on this device and do not change care records.</small><Button onClick={save}>{saved ? <><Check />Saved</> : 'Save profile'}</Button></div>
  </section>;
}
