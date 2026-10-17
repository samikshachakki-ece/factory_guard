import type { Machine } from './machines';
export type Period = '6h' | '12h' | '24h';
// Deterministic sample history, not a telemetry simulator or status classifier.
export function mockSensorHistory(machine: Machine, period: Period) {
  const hours = Number.parseInt(period);
  return Array.from({length:13},(_,i)=>({time:`${String(Math.floor(8-hours+i*hours/12+24)%24).padStart(2,'0')}:${i%2 ? '30':'00'}`,temperature:Number((machine.temperature-5+Math.sin(i*1.1)*2.4+i*.4).toFixed(1)),rpm:Math.round(machine.rpm-45+Math.sin(i*1.5)*55+i*4),torque:Number((machine.torque+Math.sin(i)*2).toFixed(1)),wear:Math.round(machine.wear-12+i)}));
}
