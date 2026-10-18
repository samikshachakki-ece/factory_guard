import { useMemo, useState } from 'react';
import { Link, useNavigate } from '@tanstack/react-router';
import { Search, ArrowUpDown, ArrowUp, ArrowDown, ChevronRight, SlidersHorizontal } from 'lucide-react';
import type { Machine } from '@/data/machines';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Status, FilterSelect, healthOptions, EmptyState } from './shared';
import { useTemperature, formatTimestamp, useFactory } from './state';

export function MachineTable({ overview = false }: { overview?: boolean }) {
  const [search, setSearch] = useState('');
  const [status, setStatus] = useState('all');
  const [sort, setSort] = useState<keyof Machine>('id');
  const [desc, setDesc] = useState(false);
  const [page, setPage] = useState(1);
  const navigate = useNavigate();
  const temp = useTemperature();
  const { preferences, machines, dataLoading, dataError } = useFactory();
  const filtered = useMemo(() => machines
    .filter((machine) => (status === 'all' || machine.status === status)
      && `${machine.id} ${machine.name}`.toLowerCase().includes(search.toLowerCase()))
    .sort((a, b) => {
      const left = a[sort];
      const right = b[sort];
      return (typeof left === 'number' && typeof right === 'number'
        ? left - right
        : String(left ?? '').localeCompare(String(right ?? ''))) * (desc ? -1 : 1);
    }), [machines, status, search, sort, desc]);
  const size = overview ? 6 : 8;
  const pages = Math.max(1, Math.ceil(filtered.length / size));
  const current = Math.min(page, pages);
  const rows = filtered.slice((current - 1) * size, current * size);
  const columns: { key: keyof Machine; label: string }[] = [
    { key: 'id', label: 'Machine ID' },
    { key: 'name', label: 'Machine name' },
    { key: 'temperature', label: `Temp (${temp.unit})` },
    { key: 'vibration', label: 'Vibration (mm/s)' },
    { key: 'pressure', label: 'Pressure (bar)' },
    { key: 'status', label: 'Health status' },
    { key: 'updatedAt', label: 'Last updated' },
  ];

  function changeSort(key: keyof Machine) {
    setDesc(sort === key ? !desc : false);
    setSort(key);
  }

  return (
    <div className="table-panel">
      <div className="panel-heading">
        <div className="panel-title">
          <h2>{overview ? 'Machine health overview' : 'Machine inventory'}</h2>
          <span className="count-badge">{machines.length}</span>
        </div>
        {overview && <Link className="text-link" to="/machines">View all machines <ChevronRight size={14} /></Link>}
      </div>
      <div className="table-toolbar">
        <div className="search-input"><Search size={15} /><Input aria-label="Search machine table" placeholder="Search by machine ID or name..." value={search} onChange={(event) => { setSearch(event.target.value); setPage(1); }} /></div>
        <div className="filter-group"><SlidersHorizontal size={14} /><FilterSelect value={status} onChange={(value) => { setStatus(value); setPage(1); }} label="Filter machine status" options={healthOptions} /></div>
      </div>
      <div className="table-scroll">
        <table className={preferences.compact ? 'data-table compact' : 'data-table'}>
          <thead><tr>{columns.map((column) => <th key={column.key} aria-sort={sort === column.key ? (desc ? 'descending' : 'ascending') : 'none'}><Button variant="ghost" onClick={() => changeSort(column.key)}>{column.label}{sort === column.key ? (desc ? <ArrowDown size={11} /> : <ArrowUp size={11} />) : <ArrowUpDown size={11} />}</Button></th>)}<th /></tr></thead>
          <tbody>{rows.map((machine) => <tr key={machine.id} onClick={() => navigate({ to: '/machines/$machineId', params: { machineId: machine.id } })}>
            <td className="machine-id">{machine.id}</td>
            <td><span className="machine-name">{machine.name}</span></td>
            <td className={machine.status === 'Critical' ? 'text-critical' : machine.status === 'Warning' ? 'text-warning' : ''}>{temp.convert(machine.temperature).toFixed(1)}{temp.unit}</td>
            <td>{machine.vibration === undefined ? 'Unavailable' : machine.vibration.toFixed(1)}</td>
            <td>{machine.pressure === undefined ? 'Unavailable' : machine.pressure.toFixed(1)}</td>
            <td><Status status={machine.status} /></td>
            <td className="time-cell">{formatTimestamp(machine.updatedAt)}</td>
            <td><Link title={`View ${machine.name}`} aria-label={`View details for ${machine.id}`} to="/machines/$machineId" params={{ machineId: machine.id }} onClick={(event) => event.stopPropagation()} className="row-link"><ChevronRight size={16} /></Link></td>
          </tr>)}</tbody>
        </table>
      </div>
      {!rows.length && <EmptyState title={dataLoading ? 'Loading machines...' : machines.length === 0 && dataError ? 'Machine data unavailable' : 'No machines found'} detail={dataLoading ? 'Fetching inventory from the backend.' : machines.length === 0 && dataError ? dataError : 'Try another search or adjust your filters.'} />}
      <div className="table-footer"><span>Showing {filtered.length ? (current - 1) * size + 1 : 0}–{Math.min(current * size, filtered.length)} of {filtered.length} machines</span><div className="pagination"><Button variant="outline" size="sm" onClick={() => setPage(current - 1)} disabled={current === 1}>Previous</Button>{Array.from({ length: pages }, (_, index) => <Button key={index} size="sm" variant={current === index + 1 ? 'secondary' : 'ghost'} onClick={() => setPage(index + 1)}>{index + 1}</Button>)}<Button variant="outline" size="sm" onClick={() => setPage(current + 1)} disabled={current === pages}>Next</Button></div></div>
    </div>
  );
}
