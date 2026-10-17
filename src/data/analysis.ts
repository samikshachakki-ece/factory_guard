import type { Machine } from './machines';
export function mockAnalysis(machine: Machine) {
 const critical=machine.status==='Critical';
 return {machineId:machine.id,source:'DEMO DATA',timestamp:'2026-10-12T08:45:00Z',severity:machine.status,confidence:critical ? 87 : machine.status==='Warning' ? 76 : 92,
 anomalies: machine.status==='Healthy' ? ['No anomalies assigned in this sample record.'] : critical ? ['Temperature deviation recorded in the demo history.','Irregular rotational speed pattern in sample observations.','Tool wear record flagged for inspection.'] : ['Sensor variation flagged in the sample history.','Inspection reminder associated with this machine.'],
 causes: machine.status==='Healthy' ? ['No failure cause assigned in the demo.'] : ['Cooling flow restriction or insufficient lubrication','Bearing wear or spindle misalignment','Tool condition or an inconsistent process load'],
 steps:['Follow the site-approved isolation and lockout procedure before inspection.','Review the machine manual and recent maintenance records.','Have qualified personnel inspect cooling, lubrication and tool condition.','Validate sensor calibration and compare readings with approved operating specifications.']};
}
