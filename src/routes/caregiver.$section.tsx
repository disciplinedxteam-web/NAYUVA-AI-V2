import { createFileRoute,notFound } from '@tanstack/react-router';
import { Dashboard,type Section } from '@/components/care/dashboard';
const sections=['svara','milan','sutra','emergency'];
export const Route=createFileRoute('/caregiver/$section')({beforeLoad:({params})=>{if(!sections.includes(params.section))throw notFound();},head:({params})=>({meta:[{title:`${params.section} — Nayuva AI Caregiver`},{name:'description',content:'Meera Sharma’s connected newborn care journey.'},{property:'og:title',content:'Caregiver — Nayuva AI'},{property:'og:description',content:'Home check-ins, appointments and your newborn’s care journey.'},{property:'og:type',content:'website'},{name:'twitter:card',content:'summary'},{name:'robots',content:'noindex'}]}),component:CaregiverPage});
function CaregiverPage(){const {section}=Route.useParams();return <Dashboard role="caregiver" section={section as Section}/>;}
