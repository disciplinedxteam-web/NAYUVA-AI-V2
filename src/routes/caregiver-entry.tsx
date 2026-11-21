import { createFileRoute,Link,useNavigate } from '@tanstack/react-router';
import { useServerFn } from '@tanstack/react-start';
import { useQuery } from '@tanstack/react-query';
import { useState } from 'react';
import { ArrowLeft,ArrowRight,Heart,ChevronDown,Search,Check } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { DropdownMenu,DropdownMenuTrigger,DropdownMenuContent,DropdownMenuItem } from '@/components/ui/dropdown-menu';
import logo from '@/assets/nayuva-logo.png.asset.json';
import { BrandWordmark } from '@/components/brand-wordmark';
import { listCaregiverDemos,openDemo } from '@/lib/care.functions';
export const Route=createFileRoute('/caregiver-entry')({head:()=>({meta:[{title:'Choose a Caregiver Demo — Nayuva AI'},{name:'description',content:'Select a connected synthetic caregiver and baby profile for the Nayuva care demo.'},{property:'og:title',content:'Caregiver Demo — Nayuva AI'},{property:'og:description',content:'Choose your connected caregiver demo profile.'},{property:'og:type',content:'website'},{name:'twitter:card',content:'summary'},{name:'robots',content:'noindex'}]}),component:CaregiverEntry});
function CaregiverEntry(){
 const list=useServerFn(listCaregiverDemos),enter=useServerFn(openDemo),navigate=useNavigate();
 const query=useQuery({queryKey:['caregiver-demo-directory'],queryFn:list});
 const [busy,setBusy]=useState(false),[error,setError]=useState(''),[selected,setSelected]=useState(''),[search,setSearch]=useState('');
 const profile=query.data?.find(p=>p.id===selected);
 const profiles=query.data?.filter(p=>(p.caregiver_name+' '+p.baby_name).toLowerCase().includes(search.toLowerCase()))??[];
 async function proceed(){if(!profile||busy)return;setBusy(true);setError('');try{await enter({data:{role:'caregiver',profileId:profile.id}});await navigate({to:'/caregiver-guide'});}catch{setError('Unable to open this profile. Please try again.');setBusy(false);}}
 return <main className="caregiver-entry page-shell">
  <Button asChild variant="ghost" className="entry-back"><Link to="/"><ArrowLeft/>Back to Nayuva AI</Link></Button>
  <section className="entry-access-card" aria-label="Caregiver demo access">
   <div className="entry-selection">
    <Link to="/" className="entry-logo-square brand-spin" aria-label="Nayuva AI home"><img src={logo.url} alt="Nayuva AI logo"/></Link>
    <div className="entry-intro"><p className="eyebrow">Caregiver access</p><h1>Choose your care profile</h1><p>Simply select a profile to explore the platform and experience its end-to-end care workflows.</p></div>
    <div className="entry-profile-field"><label id="care-profile-label">Care profile</label>
     <DropdownMenu><DropdownMenuTrigger asChild><Button variant="outline" className="entry-profile-trigger" aria-labelledby="care-profile-label" disabled={busy||query.isPending}><Heart/><span>{profile?<><strong>{profile.caregiver_name}</strong><small>{profile.baby_name}</small></>:query.isPending?'Loading care profiles…':'Select a care profile'}</span><ChevronDown/></Button></DropdownMenuTrigger>
      <DropdownMenuContent align="start" sideOffset={8} className="entry-profile-menu">
       <div className="entry-profile-search" onKeyDown={e=>e.stopPropagation()}><Search aria-hidden="true"/><Input autoFocus aria-label="Search care profiles" placeholder="Search caregiver or baby" value={search} onChange={e=>setSearch(e.target.value)}/></div>
       <div className="entry-profile-results">{profiles.map(p=><DropdownMenuItem key={p.id} className="entry-profile-option" onSelect={()=>setSelected(p.id)}><span className="entry-profile-initial">{p.baby_name.charAt(0)}</span><span><strong>{p.caregiver_name}</strong><small>{p.baby_name}</small></span>{selected===p.id&&<Check/>}</DropdownMenuItem>)}{!profiles.length&&<p>No matching care profiles.</p>}</div>
      </DropdownMenuContent></DropdownMenu>
    </div>
    {(error||query.isError)&&<p role="alert" className="entry-error">{error||'Profiles could not be loaded. Please try again.'}</p>}
    <Button className="entry-continue" disabled={!profile||busy} onClick={()=>void proceed()}>{busy?'Opening your care journey…':'Continue to care journey'}<ArrowRight/></Button>
    <p className="entry-access-note">Pre-configured demo access · No account creation</p>
   </div>
   <aside className="entry-story"><span className="entry-story-label">Connected care. Beyond discharge.</span><p><strong>Demo Access:</strong> To help judges evaluate Nayuva AI without account creation or repeated onboarding, we have built pre-configured caregiver profiles.</p><div className="entry-signature"><span className="entry-logo-square brand-spin"><img src={logo.url} alt=""/></span><span><strong><BrandWordmark/></strong><small>Developer</small></span></div></aside>
  </section>
 </main>;
}
