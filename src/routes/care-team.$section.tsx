import { createFileRoute,notFound } from '@tanstack/react-router';
import { Dashboard,type Section } from '@/components/care/dashboard';
const sections=['updates','milan','lekha','sutra','care-plan','settings'];
export const Route=createFileRoute('/care-team/$section')({beforeLoad:({params})=>{if(!sections.includes(params.section))throw notFound();},head:({params})=>({meta:[{title:`${params.section.replace('-',' ')} — Nayuva AI Care Team`},{name:'description',content:'Dr. Ananya Rao’s connected newborn care workspace.'},{property:'og:title',content:'Care Team — Nayuva AI'},{property:'og:description',content:'Connected care plans, home updates, appointments and care journeys.'},{property:'og:type',content:'website'},{name:'twitter:card',content:'summary'},{name:'robots',content:'noindex'}]}),component:CareTeamPage});
function CareTeamPage(){const {section}=Route.useParams();return <Dashboard role="care-team" section={section as Section}/>;}
