import { Link } from '@tanstack/react-router';
import { ArrowLeft, ScanLine, MessageSquare, Factory, Thermometer, Activity, Gauge } from 'lucide-react';
import machinePhoto from '@/assets/cnc-machine.jpg';
import { Button } from '@/components/ui/button';
import { PageHeading, DemoBadge, Status, EmptyState } from '@/components/factoryguard/shared';
import { MachineTable } from '@/components/factoryguard/machine-table';
import { SensorChart } from '@/components/factoryguard/charts';
import { useFactory, useTemperature, formatTimestamp } from '@/components/factoryguard/state';

export function MachinesPage() {
  const { machines, dataLoading } = useFactory();
  return <>
    <PageHeading title="Machines" description="Monitor equipment health across your production floor."><DemoBadge /></PageHeading>
    <MachineTable />
    <div className="inventory-note"><Factory size={15} />{dataLoading ? 'Loading backend inventory…' : `${machines.length} backend machine records · Temperature, vibration, and pressure readings`}</div>
  </>;
}

export function MachineDetailsPage({ machineId }: { machineId: string }) {
  const { machines, alerts, dataLoading, dataError } = useFactory();
  const temp = useTemperature();
  const machine = machines.find((item) => item.id === machineId);

  if (dataLoading && !machine) return <><PageHeading title="Loading machine" description="Fetching the machine record from the backend." /><EmptyState title="Loading machine data..." detail="The backend request is in progress." /></>;
  if (!machine) return <><PageHeading title="Machine unavailable" description={dataError || 'This machine ID was not returned by the backend.'} /><Button asChild variant="outline"><Link to="/machines"><ArrowLeft />Back to machines</Link></Button></>;

  const history = alerts.filter((alert) => alert.machineId === machine.id);
  const readings = [
    { label: 'Temperature', value: `${temp.convert(machine.temperature).toFixed(1)} ${temp.unit}`, icon: Thermometer },
    { label: 'Vibration', value: machine.vibration === undefined ? 'Unavailable' : `${machine.vibration.toFixed(1)} mm/s`, icon: Activity },
    { label: 'Pressure', value: machine.pressure === undefined ? 'Unavailable' : `${machine.pressure.toFixed(1)} bar`, icon: Gauge },
  ];

  return <>
    <Link to="/machines" className="back-link"><ArrowLeft size={14} />All machines</Link>
    <PageHeading title={machine.name} description={`${machine.id} · ${machine.type} · ${machine.line}`}><Status status={machine.status} /><DemoBadge /></PageHeading>
    <div className="detail-layout">
      <div className="machine-photo"><img src={machinePhoto} alt="Illustrative factory equipment; not a photo of this machine" width={1024} height={768} /><span>Illustrative equipment image</span></div>
      <div className="machine-detail-main">
        <div className="detail-metrics">{readings.map((reading) => <div className="detail-metric" key={reading.label}><span><reading.icon size={15} />{reading.label}</span><strong>{reading.value}</strong></div>)}</div>
        <p className="muted-small">{machine.dataSource === 'demo' ? 'Backend demo record' : 'Backend sensor record'} · {formatTimestamp(machine.updatedAt)}</p>
        <div className="detail-actions"><Button asChild><Link to="/analysis" search={{ machine: machine.id }}><ScanLine />Run analysis</Link></Button><Button asChild variant="outline"><Link to="/technician" search={{ machine: machine.id }}><MessageSquare />Technician demo</Link></Button></div>
      </div>
    </div>
    <div className="detail-charts"><SensorChart machineId={machine.id} metric="temperature" /><SensorChart machineId={machine.id} metric="vibration" /><SensorChart machineId={machine.id} metric="pressure" /></div>
    <div className="table-panel"><div className="panel-heading"><h2>Related active alerts</h2><DemoBadge /></div>{history.length ? <div className="table-scroll"><table className="data-table"><thead><tr><th>Timestamp</th><th>Alert</th><th>Severity</th><th>Status</th></tr></thead><tbody>{history.map((alert) => <tr key={alert.id}><td className="time-cell">{formatTimestamp(alert.timestamp)}</td><td>{alert.description}</td><td><Status status={alert.severity} /></td><td><span className={`event-status event-${alert.status.toLowerCase()}`}>{alert.status}</span></td></tr>)}</tbody></table></div> : <EmptyState title="No active alerts" detail="The backend has not returned an active alert for this machine." />}</div>
  </>;
}
