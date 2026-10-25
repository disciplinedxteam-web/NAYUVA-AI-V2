import { EmergencyToggle } from './emergency-toggle';
import { LanguageMenu } from '@/components/language-provider';
import { NotificationBell } from './notifications';
export function DashboardUtilities({role,settings,events,onOpen}:{role:string;settings:Record<string,string>;events:{id:string;kind:string;summary:string;created_at:string}[];onOpen:(s:string)=>void}) {
  return <div className="dashboard-utilities">{role==='caregiver'&&<EmergencyToggle settings={settings}/>}<LanguageMenu/><NotificationBell role={role} events={events} onOpen={onOpen}/></div>;
}