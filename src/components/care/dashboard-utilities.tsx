import { ChevronDown, Phone, Siren } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { LanguageMenu } from '@/components/language-provider';
export function DashboardUtilities({role,settings}:{role:string;settings:Record<string,string>}) {
  return <div className="dashboard-utilities">{role==='caregiver'&&<DropdownMenu><DropdownMenuTrigger asChild><Button variant="ghost" className="emergency-menu-trigger" aria-label="Emergency contacts"><Siren/><ChevronDown/></Button></DropdownMenuTrigger><DropdownMenuContent align="end" className="nv-select-menu">{[['careTeamContact','Care Team'],['emergencyContact','Hospital Emergency'],['ambulanceNumber','Ambulance'],['afterHoursContact','After-hours contact']].map(([key,label])=>key&&<DropdownMenuItem key={key} disabled={!settings[key]} asChild={!!settings[key]}>{settings[key]?<a href={'tel:'+settings[key].replace(/[^\d+]/g,'')}><Phone/>{label}</a>:<span>{label} · Unavailable</span>}</DropdownMenuItem>)}</DropdownMenuContent></DropdownMenu>}<LanguageMenu/></div>;
}