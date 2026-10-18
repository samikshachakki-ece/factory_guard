import { createFileRoute } from '@tanstack/react-router';
import { TechnicianPage } from '@/features/technician';
import { pageHead } from '@/lib/page-head';
export const Route=createFileRoute('/technician')({validateSearch:(search:Record<string,unknown>)=>({machine:typeof search.machine==='string'?search.machine:'M-003'}),head:()=>pageHead('AI Technician','FactoryGuard demo troubleshooting conversation with selected machine context.'),component:Technician});
function Technician(){const {machine}=Route.useSearch();return <TechnicianPage machineId={machine}/>;}
