import { indiaTimestamp, scheduleHours, type CarePlan } from './care-domain';
export type TaalEvent = { id:string; when:string; kind:'Svara'|'Appointment'; complete:boolean; detail:string };
export type TaalStatus = 'Active'|'Overdue'|'Unresponsive'|'Not yet due';
export function taalStatus(completed:number,total:number):TaalStatus {
  if(total===0)return 'Not yet due';
  return completed/total>=.8?'Active':completed/total>=.5?'Overdue':'Unresponsive';
}
export function scheduledWindow(plan:Pick<CarePlan,'frequency'|'customInterval'|'checkinTime'>,effectiveAt:string,now:number,days=14) {
  const anchor=new Date(effectiveAt).getTime();
  const day=new Date(anchor).toLocaleDateString('en-CA',{timeZone:'Asia/Kolkata'});
  const interval=scheduleHours(plan.frequency,plan.customInterval)*3600000;
  let first=new Date(indiaTimestamp(day,plan.checkinTime)).getTime();
  if(first<anchor)first+=interval;
  const start=Math.max(anchor,now-days*86400000);
  const slots:number[]=[];
  for(let t=first+Math.max(0,Math.ceil((start-first)/interval))*interval;t<=now;t+=interval)slots.push(t);
  return slots;
}
export function summarizeActivity(events:TaalEvent[]){
 const completed=events.filter(e=>e.complete).length,missed=events.length-completed;
 const missing=events.filter(e=>!e.complete);
 const checkins=missing.filter(e=>e.kind==='Svara').length,appointments=missing.filter(e=>e.kind==='Appointment').length;
 return {completed,total:events.length,missed,status:taalStatus(completed,events.length),rate:events.length?Math.round(completed/events.length*100):null,reason:events.length?missed?`${checkins} overdue Svara check-in${checkins===1?'':'s'} · ${appointments} appointment${appointments===1?'':'s'} not marked completed`:'All due check-ins and appointments completed':'No eligible activity in this fortnight'};
}