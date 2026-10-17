import { createFileRoute } from '@tanstack/react-router';
import { SettingsPage } from '@/features/settings';
import { pageHead } from '@/lib/page-head';
export const Route=createFileRoute('/settings')({head:()=>pageHead('Settings','Configure FactoryGuard local display, temperature units and notification preferences.'),component:SettingsPage});
