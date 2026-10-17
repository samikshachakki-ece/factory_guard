import { createFileRoute } from '@tanstack/react-router';
import { MachineDetailsPage } from '@/features/machines';
import { pageHead } from '@/lib/page-head';
export const Route=createFileRoute('/machines/$machineId')({head:({params})=>pageHead(`${params.machineId} — Machine details`,'FactoryGuard sample machine sensor readings, historical trends and maintenance records.'),component:Details});
function Details(){const {machineId}=Route.useParams();return <MachineDetailsPage machineId={machineId}/>;}
