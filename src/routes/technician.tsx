import { createFileRoute } from '@tanstack/react-router';
import { TechnicianPage } from '@/features/technician';
import { pageHead } from '@/lib/page-head';
import { api } from '@/services/api';
export const Route=createFileRoute('/technician')({validateSearch:(search:Record<string,unknown>)=>({machine:typeof search.machine==='string'&&api.listMachines().some(m=>m.id===search.machine)?search.machine:'MCH-003'}),head:()=>pageHead('AI Technician','FactoryGuard demo troubleshooting conversation with selected machine context.'),component:Technician});
function Technician(){const {machine}=Route.useSearch();return <TechnicianPage machineId={machine}/>;}
