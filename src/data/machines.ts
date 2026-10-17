export type Health = 'Healthy' | 'Warning' | 'Critical';
export interface Machine { id: string; name: string; type: string; line: string; temperature: number; rpm: number; torque: number; wear: number; status: Health; updatedAt: string }
export const sampleTimestamp = '2026-10-12T08:45:00Z';
export const mockMachines: Machine[] = [
  {id:'MCH-001',name:'CNC Milling Machine',type:'CNC mill',line:'Production line A',temperature:64.2,rpm:1480,torque:42.6,wear:124,status:'Healthy',updatedAt:sampleTimestamp},
  {id:'MCH-002',name:'Hydraulic Press',type:'Press',line:'Production line A',temperature:78.5,rpm:920,torque:56.3,wear:186,status:'Warning',updatedAt:sampleTimestamp},
  {id:'MCH-003',name:'Industrial Lathe',type:'CNC lathe',line:'Production line B',temperature:92.8,rpm:2120,torque:68.1,wear:238,status:'Critical',updatedAt:sampleTimestamp},
  {id:'MCH-004',name:'Conveyor Drive',type:'Drive system',line:'Assembly line',temperature:48.6,rpm:850,torque:28.4,wear:62,status:'Healthy',updatedAt:sampleTimestamp},
  {id:'MCH-005',name:'Grinding Machine',type:'Grinder',line:'Production line B',temperature:61.4,rpm:1820,torque:38.9,wear:98,status:'Healthy',updatedAt:sampleTimestamp},
  {id:'MCH-006',name:'Air Compressor',type:'Compressor',line:'Utilities',temperature:81.3,rpm:1650,torque:51.2,wear:172,status:'Warning',updatedAt:sampleTimestamp},
  {id:'MCH-007',name:'Injection Molder',type:'Molding machine',line:'Production line C',temperature:67.1,rpm:1240,torque:44.5,wear:112,status:'Healthy',updatedAt:sampleTimestamp},
  {id:'MCH-008',name:'Robotic Assembly Arm',type:'Robot',line:'Assembly line',temperature:52.8,rpm:760,torque:31.7,wear:74,status:'Healthy',updatedAt:sampleTimestamp},
  {id:'MCH-009',name:'Sheet Metal Cutter',type:'Cutter',line:'Production line C',temperature:59.6,rpm:1360,torque:36.8,wear:86,status:'Healthy',updatedAt:sampleTimestamp},
  {id:'MCH-010',name:'Cooling Pump',type:'Pump',line:'Utilities',temperature:45.2,rpm:1450,torque:24.1,wear:48,status:'Healthy',updatedAt:sampleTimestamp},
  {id:'MCH-011',name:'Precision Drill',type:'Drill',line:'Production line A',temperature:62.7,rpm:1950,torque:39.4,wear:105,status:'Healthy',updatedAt:sampleTimestamp},
  {id:'MCH-012',name:'Packaging Motor',type:'Motor',line:'Packaging line',temperature:54.3,rpm:1100,torque:32.6,wear:79,status:'Healthy',updatedAt:sampleTimestamp},
];
