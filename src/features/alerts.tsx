import { useState } from 'react';
import { Link } from '@tanstack/react-router';
import { Search, ArrowUpRight, Check, CheckCheck, History } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { PageHeading, DemoBadge, FilterSelect, healthOptions, Status, EmptyState } from '@/components/factoryguard/shared';
import { useFactory, formatTimestamp } from '@/components/factoryguard/state';

export function AlertsPage() {
  const { alerts, machines, updateAlert, dataLoading } = useFactory();
  const [search, setSearch] = useState('');
  const [severity, setSeverity] = useState('all');
  const [machine, setMachine] = useState('all');
  const [notice, setNotice] = useState('');
  const filtered = alerts.filter((alert) => (severity === 'all' || severity === alert.severity)
    && (machine === 'all' || machine === alert.machineId)
    && `${alert.id} ${alert.machineId} ${alert.description} ${alert.status}`.toLowerCase().includes(search.toLowerCase()));

  function updateStatus(id: number | string, status: 'Acknowledged' | 'Resolved') {
    updateAlert(id, status);
    setNotice('This alert change is local to this browser session. The backend does not provide an alert update endpoint.');
  }

  return <>
    <PageHeading title="Alerts & History" description="Review backend alerts and track local follow-up actions."><DemoBadge /></PageHeading>
    <div className="alert-summary">{['Open', 'Acknowledged', 'Resolved'].map((status) => <div key={status}><span>{status} alerts</span><strong>{String(alerts.filter((alert) => alert.status === status).length).padStart(2, '0')}</strong></div>)}</div>
    {notice && <div role="status" className="success-notice">{notice}</div>}
    <div className="table-panel">
      <div className="panel-heading"><h2><History size={16} />Active backend alerts</h2><span className="muted-small">Times shown in UTC</span></div>
      <div className="table-toolbar">
        <div className="search-input"><Search size={15} /><Input aria-label="Search alerts" value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Search alerts, machines or descriptions..." /></div>
        <div className="filter-group"><FilterSelect value={severity} onChange={setSeverity} label="Filter alert severity" options={healthOptions.map((option) => option.value === 'all' ? { ...option, label: 'All severities' } : option)} /><FilterSelect value={machine} onChange={setMachine} label="Filter alert machine" options={[{ value: 'all', label: 'All machines' }, ...machines.map((item) => ({ value: item.id, label: item.id }))]} /></div>
      </div>
      <div className="table-scroll"><table className="data-table alerts-table"><thead><tr><th>Alert ID</th><th>Machine</th><th>Severity</th><th>Description</th><th>Timestamp</th><th>Status</th><th>Session action</th></tr></thead>
        <tbody>{filtered.map((alert) => <tr key={alert.id}>
          <td className="machine-id">{alert.id}</td>
          <td><Link to="/machines/$machineId" params={{ machineId: alert.machineId }} className="text-link">{machines.find((item) => item.id === alert.machineId)?.name ?? alert.machineId}<ArrowUpRight size={12} /></Link></td>
          <td><Status status={alert.severity} /></td>
          <td>{alert.description}</td>
          <td className="time-cell">{formatTimestamp(alert.timestamp)}</td>
          <td><span className={`event-status event-${alert.status.toLowerCase()}`}>{alert.status}</span></td>
          <td><div className="alert-actions">{alert.status === 'Open' && <Button size="icon" variant="ghost" title="Acknowledge for this session" aria-label={`Acknowledge alert ${alert.id}`} onClick={() => updateStatus(alert.id, 'Acknowledged')}><Check size={15} /></Button>}{alert.status === 'Acknowledged' && <Button size="icon" variant="ghost" title="Resolve for this session" aria-label={`Resolve alert ${alert.id}`} onClick={() => updateStatus(alert.id, 'Resolved')}><CheckCheck size={15} /></Button>}</div></td>
        </tr>)}</tbody></table></div>
      {!filtered.length && <EmptyState title={dataLoading ? 'Loading alerts...' : 'No active alerts'} detail={dataLoading ? 'Fetching alerts from the backend.' : 'The backend returned no alerts matching these filters.'} />}
    </div>
  </>;
}
