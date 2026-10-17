import type { ReactNode } from 'react';
import type { Health } from '@/data/machines';
import { api } from '@/services/api';
import { Select,SelectContent,SelectItem,SelectTrigger,SelectValue } from '@/components/ui/select';
export function Status({status}:{status:Health}){return <span className={`status status-${status.toLowerCase()}`}><span className="status-dot"/>{status}</span>;}
export function DemoBadge(){return <span className="demo-badge">DEMO DATA</span>;}
export function PageHeading({title,description,children}:{title:string;description:string;children?:ReactNode}){return <div className="page-heading"><div><div className="eyebrow">ENGINEERING WORKSPACE</div><h1>{title}</h1><p>{description}</p></div><div className="heading-actions">{children}</div></div>;}
export function MachineSelect({value,onChange}:{value:string;onChange:(v:string)=>void}){return <Select value={value} onValueChange={onChange}><SelectTrigger className="machine-select" aria-label="Select machine"><SelectValue/></SelectTrigger><SelectContent>{api.listMachines().map(m=><SelectItem key={m.id} value={m.id}>{m.id} · {m.name}</SelectItem>)}</SelectContent></Select>;}
export function FilterSelect({value,onChange,label,options}:{value:string;onChange:(v:string)=>void;label:string;options:{value:string;label:string}[]}){return <Select value={value} onValueChange={onChange}><SelectTrigger className="filter-select" aria-label={label}><SelectValue/></SelectTrigger><SelectContent>{options.map(o=><SelectItem key={o.value} value={o.value}>{o.label}</SelectItem>)}</SelectContent></Select>;}
export function EmptyState({title='No machines found',detail='Try another search or adjust your filters.'}:{title?:string;detail?:string}){return <div className="empty-state"><h3>{title}</h3><p>{detail}</p></div>;}
export const healthOptions=[{value:'all',label:'All statuses'},...['Healthy','Warning','Critical'].map(s=>({value:s,label:s}))];
