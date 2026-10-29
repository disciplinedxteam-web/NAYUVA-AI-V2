import { useState } from 'react';
import { SearchToggle } from '@/components/ui/search-toggle';
import { GlassToggle } from '@/components/ui/glass-toggle';
import { CareTicket } from './care-ticket';
import { DocumentActions } from './document-actions';
import { WorkspaceHeading } from './workspace-heading';
import { parseCard } from '@/lib/care-card';
import type { getCareData } from '@/lib/care.functions';

type Data = Awaited<ReturnType<typeof getCareData>>;
const fmt = (v: string) => new Date(v).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric', timeZone: 'Asia/Kolkata' });

/** Read-only list of the caregiver's documented appointment reports, filterable by offline/online. */
export function CaregiverLekha({ data }: { data: Data }) {
  const [tab, setTab] = useState('offline'), [search, setSearch] = useState('');
  const rows = data.notes.map((n) => ({ n, a: data.appointments.find((a) => a.id === n.appointment_id) })).filter((r) => r.a);
  const isOnline = (r: (typeof rows)[number]) => (r.a?.location as Record<string, unknown> | null)?.['mode'] === 'online';
  const offline = rows.filter((r) => !isOnline(r)), online = rows.filter(isOnline);
  const list = (tab === 'online' ? online : offline).filter((r) => `${r.a?.reason ?? ''} ${r.n.observations}`.toLowerCase().includes(search.toLowerCase()));
  return <>
    <WorkspaceHeading title="Lekha" description="Documented reports from your appointments." />
    <div className="ws-bar"><SearchToggle label="Search appointment reports" placeholder="Search reports" value={search} onChange={setSearch}><GlassToggle value={tab} onChange={setTab} options={[{ key: 'offline', label: 'Offline', count: offline.length }, { key: 'online', label: 'Online', count: online.length }]} /></SearchToggle></div>
    {list.length ? <div className="ws-grid">{list.map(({ n, a }) => { const b = data.babies.find((x) => x.id === n.baby_id); const when = fmt(a?.starts_at ?? n.created_at); return <CareTicket key={n.id} source="Lekha" title={b?.baby_name ?? 'Appointment'} subtitle={isOnline({ n, a }) ? 'Online video' : 'In-person'} stamp={null} fields={[{ label: 'Doctor', value: 'Dr. Ananya Rao' }, { label: 'Date & time', value: when }, { label: 'Reason', value: a?.reason ?? 'Appointment' }]} footer={<DocumentActions meta={{ kind: isOnline({ n, a }) ? 'online' : 'encounter', babyName: b?.baby_name ?? 'Baby', caregiverName: b?.caregiver_name ?? '—', reason: a?.reason ?? 'Appointment', when, clinician: 'Dr. Ananya Rao' }} card={parseCard(n.observations)} />} />; })}</div>
      : <p className="care-empty">No documented {tab} appointments yet.</p>}
  </>;
}
