import { useEffect, useState } from 'react';
import { Camera, Check, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { GlassToggle } from '@/components/ui/glass-toggle';
import { useServerFn } from '@tanstack/react-start';
import { useQueryClient } from '@tanstack/react-query';
import { saveProfilePhoto } from '@/lib/care.functions';

import { profileDefaults, profilePreferenceKey, readProfilePrefs, type ProfilePrefs } from '@/lib/profile-preferences';

// Local display preferences are identity-scoped; shared photos come from the authorized care data.
const EVENT = 'nayuva-profile-change';

export function useProfilePhoto(role: string, profileId?: string) {
  const [photo, setPhoto] = useState('');
  useEffect(() => { const sync = () => setPhoto(readProfilePrefs(localStorage, role, profileId).photo ?? ''); sync(); window.addEventListener(EVENT, sync); return () => window.removeEventListener(EVENT, sync); }, [role, profileId]);
  return photo;
}

function resize(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const img = new Image(); const url = URL.createObjectURL(file);
    img.onload = () => { const c = document.createElement('canvas'); const s = 192; c.width = c.height = s; const r = Math.min(img.width, img.height);
      const ctx = c.getContext('2d'); if (!ctx) { URL.revokeObjectURL(url); reject(new Error('Unable to prepare this image.')); return; } ctx.drawImage(img, (img.width - r) / 2, (img.height - r) / 2, r, r, 0, 0, s, s); URL.revokeObjectURL(url); resolve(c.toDataURL('image/jpeg', 0.8)); };
    img.onerror = () => { URL.revokeObjectURL(url); reject(new Error('Unable to read this image.')); };
    img.src = url;
  });
}

export function ProfileSettings({ role, defaultName, relationship, profileId, sharedPhoto = '' }: { role: string; defaultName: string; relationship?: string | undefined; profileId?: string | undefined; sharedPhoto?: string | undefined }) {
  const team = role === 'care-team';
  const [p, setP] = useState<ProfilePrefs>(() => profileDefaults(defaultName, relationship));
  const [saved, setSaved] = useState(false); const [error, setError] = useState('');
  useEffect(() => { setP({ ...profileDefaults(defaultName, relationship), ...readProfilePrefs(localStorage, role, profileId), photo: sharedPhoto }); setSaved(false); setError(''); }, [role, profileId, defaultName, relationship, sharedPhoto]);
  const set = (k: keyof ProfilePrefs, v: string) => { setSaved(false); setP(x => ({ ...x, [k]: v })); };
  const pushPhoto = useServerFn(saveProfilePhoto); const qc = useQueryClient();
  const save = async () => { const key = profilePreferenceKey(role, profileId); if (!key) { setError('Please open your caregiver profile again.'); return; } try { setError(''); await pushPhoto({ data: { photo: p.photo } }); localStorage.setItem(key, JSON.stringify(p)); window.dispatchEvent(new Event(EVENT)); await qc.invalidateQueries({ queryKey: ['care-data'] }); setSaved(true); } catch { setError('Your profile could not be saved. Please try again.'); } };
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
    <div className="ps-footer"><small>Your photo is shown to the people you chat with. It never changes care records.</small><Button onClick={() => void save()}>{saved ? <><Check />Saved</> : 'Save profile'}</Button></div>
  </section>;
}
