import { Link } from '@tanstack/react-router';
import { Factory, ShieldCheck, TriangleAlert, OctagonAlert, ArrowUpRight, CalendarDays, RefreshCw, ArrowRight, Clock3 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { PageHeading, DemoBadge } from '@/components/factoryguard/shared';
import { SensorChart, HealthChart } from '@/components/factoryguard/charts';
import { MachineTable } from '@/components/factoryguard/machine-table';
import { formatTimestamp, useFactory } from '@/components/factoryguard/state';

export function OverviewPage() {
  const { machines, alerts, dataLoading, refreshData } = useFactory();
  const summary = [
    { label: 'Total machines', count: machines.length, icon: Factory, tone: 'primary', note: 'Backend inventory' },
    { label: 'Healthy machines', count: machines.filter((machine) => machine.status === 'Healthy').length, icon: ShieldCheck, tone: 'healthy', note: 'Backend-reported status' },
    { label: 'Warning machines', count: machines.filter((machine) => machine.status === 'Warning').length, icon: TriangleAlert, tone: 'warning', note: 'Backend-reported status' },
    { label: 'Critical machines', count: machines.filter((machine) => machine.status === 'Critical').length, icon: OctagonAlert, tone: 'critical', note: 'Backend-reported status' },
  ];
  const selected = machines[0];

  return <>
    <PageHeading title="Overview" description="A clear view of your machines. Every signal, in one place.">
      <span className="date-label"><CalendarDays size={14} />{selected ? formatTimestamp(selected.updatedAt) : 'No machine timestamp'}</span>
      <Button variant="outline" onClick={refreshData} disabled={dataLoading}><RefreshCw size={14} className={dataLoading ? 'spin' : ''} />{dataLoading ? 'Refreshing' : 'Refresh'}</Button>
    </PageHeading>
    <div className="snapshot-line"><DemoBadge /><span>{machines.length} machine records from the backend</span><span className="snapshot-note">Historical sensor telemetry is not provided by the current API.</span></div>
    <div className="summary-grid">{summary.map((item) => <div className={`summary-card summary-${item.tone}`} key={item.label}>
      <div className="summary-top"><span>{item.label}</span><span className={`metric-icon metric-${item.tone}`}><item.icon size={19} /></span></div>
      <div className="summary-value">{String(item.count).padStart(2, '0')}<span>machines</span></div>
      <div className="summary-note"><span className={`status-dot dot-${item.tone}`} />{item.note}{item.tone === 'primary' && <ArrowUpRight size={14} />}</div>
    </div>)}</div>
    <div className="section-label"><h2>Sensor intelligence</h2><span>{selected ? <>Selected machine: <strong>{selected.id}</strong> · {selected.name}</> : 'No machine selected'}</span></div>
    <div className="charts-grid"><SensorChart metric="temperature" /><SensorChart metric="vibration" /><HealthChart /></div>
    <MachineTable overview />
    <section className="recent-alerts"><div className="panel-heading"><div className="panel-title"><h2><TriangleAlert size={16} />Recent alerts</h2><span className="count-badge">{alerts.filter((alert) => alert.status === 'Open').length} open</span></div><Link to="/alerts" className="text-link">View alert history <ArrowRight size={14} /></Link></div>
      <div className="alert-card-grid">{alerts.slice(0, 3).map((alert) => {
        const machine = machines.find((item) => item.id === alert.machineId);
        return <div className={`recent-alert alert-${alert.severity.toLowerCase()}`} key={alert.id}>
          <div className="recent-alert-top"><span className={`alert-icon text-${alert.severity.toLowerCase()}`}>{alert.severity === 'Critical' ? <OctagonAlert size={17} /> : <TriangleAlert size={17} />}</span><span className="alert-open">{alert.status}</span></div>
          <h3>{alert.description}</h3><p>{machine?.name ?? alert.machineId} <span>·</span> {alert.machineId}</p>
          <div className="recent-alert-footer"><span><Clock3 size={11} />{formatTimestamp(alert.timestamp)}</span><span>{alert.severity}</span></div>
        </div>;
      })}</div>
    </section>
  </>;
}
