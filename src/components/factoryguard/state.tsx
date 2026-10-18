import { createContext, useContext, useEffect, useState, type Dispatch, type ReactNode, type SetStateAction } from 'react';
import { api } from '@/services/api';
import type { Machine } from '@/data/machines';
import type { MachineAlert } from '@/data/alerts';
import { initialMessages } from '@/data/technician';
import type { UIMessage } from 'ai';

export interface Preferences {temperature:'C'|'F';compact:boolean;criticalNotifications:boolean;warningNotifications:boolean;emailDigest:boolean}
const defaults:Preferences={temperature:'C',compact:false,criticalNotifications:true,warningNotifications:true,emailDigest:false};
interface AppState {
 machines: Machine[];
 alerts: MachineAlert[];
 dataLoading: boolean;
 dataError: string;
 refreshData: () => void;
 updateAlert: (id: MachineAlert['id'], status: MachineAlert['status']) => void;
 preferences: Preferences;
 setPreferences: (p: Preferences) => void;
 messages: UIMessage[];
 setMessages: Dispatch<SetStateAction<UIMessage[]>>;
 storageError: string;
}
const Context=createContext<AppState|null>(null);

export function FactoryProvider({children}:{children:ReactNode}){
 const [machines,setMachines]=useState<Machine[]>([]);
 const [alerts,setAlerts]=useState<MachineAlert[]>([]);
 const [dataLoading,setDataLoading]=useState(true);
 const [dataError,setDataError]=useState('');
 const [refreshKey,setRefreshKey]=useState(0);
 const [preferences,setPrefs]=useState(defaults);
 const [messages,setMessages]=useState<UIMessage[]>(initialMessages);
 const [storageError,setStorageError]=useState('');

 useEffect(()=>{
  const controller=new AbortController();
  let cancelled=false;
  setDataLoading(true);
  setDataError('');

  Promise.allSettled([
   api.listMachines(controller.signal),
   api.listAlerts(controller.signal),
  ]).then(([machineResult,alertResult])=>{
   if(cancelled)return;
   const failures:string[]=[];
    if(machineResult.status==='fulfilled')setMachines(machineResult.value);
   else{setMachines([]);failures.push(machineResult.reason instanceof Error?machineResult.reason.message:'Machine inventory could not be loaded.');}
    if(alertResult.status==='fulfilled'){
     const knownMachineIds=machineResult.status==='fulfilled'?new Set(machineResult.value.map(machine=>machine.id)):null;
     const validAlerts=knownMachineIds?alertResult.value.filter(alert=>knownMachineIds.has(alert.machineId)):alertResult.value;
     if(validAlerts.length!==alertResult.value.length)failures.push('Some backend alerts reference machines missing from the inventory.');
     setAlerts(validAlerts);
    }
   else{setAlerts([]);failures.push(alertResult.reason instanceof Error?alertResult.reason.message:'Alerts could not be loaded.');}
   setDataError(failures.join(' '));
  }).finally(()=>{if(!cancelled)setDataLoading(false)});

  return ()=>{cancelled=true;controller.abort()};
 },[refreshKey]);

 useEffect(()=>{try{const saved=localStorage.getItem('factoryguard-preferences');if(saved){const p=JSON.parse(saved);setPrefs({...defaults,...p,temperature:p.temperature==='F'?'F':'C'});}}catch{setStorageError('Browser preferences could not be restored.');}},[]);

 function refreshData(){setMachines([]);setAlerts([]);setRefreshKey(key=>key+1)}
 function setPreferences(p:Preferences){setPrefs(p);try{localStorage.setItem('factoryguard-preferences',JSON.stringify(p));setStorageError('');}catch{setStorageError('Preferences apply for this session; browser storage is unavailable.');}}

 return <Context.Provider value={{machines,alerts,dataLoading,dataError,refreshData,updateAlert:(id,status)=>setAlerts(current=>current.map(alert=>String(alert.id)===String(id)?{...alert,status}:alert)),preferences,setPreferences,messages,setMessages,storageError}}>{children}</Context.Provider>;
}

export function useFactory(){const context=useContext(Context);if(!context)throw new Error('FactoryProvider is required');return context;}
export function formatTimestamp(value:string){const date=new Date(value);if(!value||Number.isNaN(date.getTime()))return 'Timestamp unavailable';return date.toLocaleString('en-GB',{timeZone:'UTC',day:'2-digit',month:'short',hour:'2-digit',minute:'2-digit',hour12:false})+' UTC';}
export function useTemperature(){const {preferences}=useFactory();return {unit:preferences.temperature==='F'?'°F':'°C',convert:(v:number)=>preferences.temperature==='F'?Number((v*9/5+32).toFixed(1)):v};}