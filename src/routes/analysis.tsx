import { createFileRoute } from '@tanstack/react-router';
import { AnalysisPage } from '@/features/analysis';
import { pageHead } from '@/lib/page-head';
import { api } from '@/services/api';
export const Route=createFileRoute('/analysis')({validateSearch:(search:Record<string,unknown>)=>({machine:typeof search.machine==='string'&&api.listMachines().some(m=>m.id===search.machine)?search.machine:'MCH-003'}),head:()=>pageHead('AI Failure Analysis','Review clearly labelled demo anomalies, possible causes and machine inspection recommendations.'),component:Analysis});
function Analysis(){const {machine}=Route.useSearch();return <AnalysisPage key={machine} machineId={machine}/>;}
