import { createFileRoute } from '@tanstack/react-router';
import { OverviewPage } from '@/features/overview';
import { pageHead } from '@/lib/page-head';
export const Route=createFileRoute('/')({head:()=>pageHead('Overview','FactoryGuard industrial machine health overview with sample sensor trends and maintenance alerts.'),component:OverviewPage});
