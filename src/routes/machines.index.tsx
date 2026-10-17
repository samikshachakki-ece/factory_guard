import { createFileRoute } from '@tanstack/react-router';
import { MachinesPage } from '@/features/machines';
import { pageHead } from '@/lib/page-head';
export const Route=createFileRoute('/machines/')({head:()=>pageHead('Machines','Search and inspect the FactoryGuard sample industrial machine inventory.'),component:MachinesPage});
