import { createFileRoute } from '@tanstack/react-router';
import { AnalysisPage } from '@/features/analysis';
import { pageHead } from '@/lib/page-head';
export const Route=createFileRoute('/analysis')({validateSearch:(search:Record<string,unknown>)=>({machine:typeof search.machine==='string'?search.machine:'M-003'}),head:()=>pageHead('Machine Analysis','Review backend rule-based analysis and available sensor model results.'),component:Analysis});
function Analysis(){const {machine}=Route.useSearch();return <AnalysisPage key={machine} machineId={machine}/>;}
