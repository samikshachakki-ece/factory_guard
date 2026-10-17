import { createContext, useContext, useEffect, useState, type ReactNode } from 'react';
import { api } from '@/services/api';
import type { MachineAlert } from '@/data/alerts';
import { initialMessages } from '@/data/technician';
import type { UIMessage } from 'ai';
export interface Preferences {temperature:'C'|'F';compact:boolean;criticalNotifications:boolean;warningNotifications:boolean;emailDigest:boolean}
const defaults:Preferences={temperature:'C',compact:false,criticalNotifications:true,warningNotifications:true,emailDigest:false};
interface AppState {alerts:MachineAlert[];updateAlert:(id:string,status:MachineAlert['status'])=>void;preferences:Preferences;setPreferences:(p:Preferences)=>void;messages:UIMessage[];setMessages:React.Dispatch<React.SetStateAction<UIMessage[]>>;storageError:string}
const Context=createContext<AppState|null>(null);
export function FactoryProvider({children}:{children:ReactNode}){
 const [alerts,setAlerts]=useState(api.listAlerts);const [preferences,setPrefs]=useState(defaults);const [messages,setMessages]=useState<UIMessage[]>(initialMessages);const [storageError,setStorageError]=useState('');
 useEffect(()=>{try{const saved=localStorage.getItem('factoryguard-preferences');if(saved){const p=JSON.parse(saved);setPrefs({...defaults,...p,temperature:p.temperature==='F'?'F':'C'});}}catch{setStorageError('Browser preferences could not be restored.');}},[]);
 function setPreferences(p:Preferences){setPrefs(p);try{localStorage.setItem('factoryguard-preferences',JSON.stringify(p));setStorageError('');}catch{setStorageError('Preferences apply for this session; browser storage is unavailable.');}}
 return <Context.Provider value={{alerts,updateAlert:(id,status)=>setAlerts(a=>a.map(x=>x.id===id?{...x,status}:x)),preferences,setPreferences,messages,setMessages,storageError}}>{children}</Context.Provider>;
}
export function useFactory(){const context=useContext(Context);if(!context)throw new Error('FactoryProvider is required');return context;}
export function formatTimestamp(value:string){return new Date(value).toLocaleString('en-GB',{timeZone:'UTC',day:'2-digit',month:'short',hour:'2-digit',minute:'2-digit',hour12:false})+' UTC';}
export function useTemperature(){const {preferences}=useFactory();return {unit:preferences.temperature==='F'?'°F':'°C',convert:(v:number)=>preferences.temperature==='F'?Number((v*9/5+32).toFixed(1)):v};}
