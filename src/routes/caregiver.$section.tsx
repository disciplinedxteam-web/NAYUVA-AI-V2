import { createFileRoute,notFound,redirect } from '@tanstack/react-router';
import { Dashboard,type Section } from '@/components/care/dashboard';
const sections=['converse','sutra','svara','settings'];
const retired=['home', 'milan', 'emergency'];
export const Route=createFileRoute('/caregiver/$section')({beforeLoad:({params})=>{if(retired.includes(params.section))throw redirect({to:'/caregiver/$section',params:{section:'sutra'}});if(!sections.includes(params.section))throw notFound();},head:({params})=>({meta:[{title:`${params.section} — Nayuva AI Caregiver`},{name:'description',content:params.section==='sutra'?'Explore reviewed care records with Sutra, your source-grounded care-journey companion.':'Your connected newborn care journey.'},{property:'og:title',content:`${params.section} — Nayuva AI Caregiver`},{property:'og:description',content:'Home check-ins, appointments and your newborn’s care journey.'},{property:'og:type',content:'website'},{name:'twitter:card',content:'summary'},{name:'robots',content:'noindex'}]}),component:CaregiverPage});
function CaregiverPage(){const {section}=Route.useParams();return <Dashboard role="caregiver" section={section as Section}/>;}
