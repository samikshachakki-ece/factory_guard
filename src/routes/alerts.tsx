import { createFileRoute } from '@tanstack/react-router';
import { AlertsPage } from '@/features/alerts';
import { pageHead } from '@/lib/page-head';
export const Route=createFileRoute('/alerts')({head:()=>pageHead('Alerts & History','Filter FactoryGuard sample machine events and demonstrate alert acknowledgement and resolution.'),component:AlertsPage});
