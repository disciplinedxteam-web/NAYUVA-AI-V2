import {useId,type ReactNode} from 'react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
export function Field({label,children}:{label:string;children:ReactNode}){return <label className="care-field"><span>{label}</span>{children}</label>;}
export function TextField({label,value,onChange,type='text',required=false}:{label:string;value:string|number;onChange:(v:string)=>void;type?:string;required?:boolean}){return <Field label={label}><Input type={type} value={value} onChange={e=>onChange(e.target.value)} required={required}/></Field>;}
export function SelectField({label,value,options,onChange}:{label:string;value:string;options:readonly string[];onChange:(v:string)=>void}){const id=useId();return <div className="care-field"><label htmlFor={id}>{label}</label><select id={id} value={value} onChange={e=>onChange(e.target.value)}>{options.map(o=><option key={o}>{o}</option>)}</select></div>;}
export function MultiField({label,value,options,onChange}:{label:string;value:string[];options:readonly string[];onChange:(v:string[])=>void}){return <fieldset className="care-multi"><legend>{label}</legend><div>{options.map(o=><label key={o}><input type="checkbox" checked={value.includes(o)} onChange={()=>onChange(o==='None'?['None']:value.includes(o)?value.filter(x=>x!==o):[...value.filter(x=>x!=='None'),o])}/><span>{o}</span></label>)}</div></fieldset>;}
export function SaveButton({busy,label='Save changes'}:{busy:boolean;label?:string}){return <Button type="submit" size="lg" disabled={busy}>{busy?'Saving…':label}</Button>;}
