import { ResponsiveContainer, PieChart, Pie, Tooltip, Cell } from 'recharts';
import { Thermometer, Activity, Gauge } from 'lucide-react';
import { useFactory, useTemperature } from './state';

const healthColors = ['var(--healthy)', 'var(--warning)', 'var(--critical)'];

export function SensorChart({ machineId, metric = 'temperature', title }: {
  machineId?: string;
  metric?: 'temperature' | 'vibration' | 'pressure';
  title?: string;
}) {
  const { machines, dataLoading } = useFactory();
  const temp = useTemperature();
  const machine = machineId ? machines.find((item) => item.id === machineId) : machines[0];
  const metrics = {
    temperature: { label: 'Temperature', unit: temp.unit, icon: Thermometer, value: machine ? temp.convert(machine.temperature) : undefined },
    vibration: { label: 'Vibration', unit: 'mm/s', icon: Activity, value: machine?.vibration },
    pressure: { label: 'Pressure', unit: 'bar', icon: Gauge, value: machine?.pressure },
  };
  const selected = metrics[metric];
  const Icon = selected.icon;

  return <div className="chart-panel">
    <div className="panel-heading"><h2><Icon size={16} />{title ?? `${selected.label} snapshot`}</h2></div>
    <div className="chart-subtitle">{machine ? `${machine.id} · ${selected.unit} · Latest backend reading` : 'Backend sensor data'}</div>
    <div className="sensor-chart flex items-center justify-center">
      {dataLoading ? <p className="muted-small">Loading sensor reading…</p>
        : !machine ? <p className="muted-small">No machine reading is available.</p>
          : selected.value === undefined ? <p className="muted-small">This sensor value is not provided by the backend.</p>
            : <div className="text-center"><strong className="text-3xl font-semibold">{selected.value.toFixed(1)}</strong><span className="ml-2 text-sm text-muted-foreground">{selected.unit}</span><p className="muted-small mt-2">Snapshot only · historical readings are not available from the API.</p></div>}
    </div>
  </div>;
}

export function HealthChart() {
  const { machines, dataLoading } = useFactory();
  const data = ['Healthy', 'Warning', 'Critical'].map((name) => ({
    name,
    value: machines.filter((machine) => machine.status === name).length,
  }));
  const total = machines.length;
  const healthyPercent = total ? Math.round((data[0]?.value ?? 0) / total * 100) : 0;

  return <div className="chart-panel health-panel">
    <div className="panel-heading"><h2>Machine health</h2><span className="muted-small">{total} backend machines</span></div>
    <div className="health-chart"><ResponsiveContainer width="100%" height="100%"><PieChart>
      <Pie data={data} innerRadius={60} outerRadius={77} paddingAngle={5} dataKey="value" stroke="none" startAngle={90} endAngle={-270} isAnimationActive={false}>{data.map((item, index) => <Cell key={item.name} fill={healthColors[index] ?? 'var(--muted)'} />)}</Pie>
      <Tooltip contentStyle={{ background: 'var(--popover)', border: '1px solid var(--border)', borderRadius: 6 }} />
    </PieChart></ResponsiveContainer><div className="donut-label"><strong>{dataLoading ? '—' : healthyPercent}<small>{dataLoading ? '' : '%'}</small></strong><span>Healthy</span></div></div>
    <div className="health-legend">{data.map((item) => <div key={item.name}><span className={`status-dot dot-${item.name.toLowerCase()}`} /><span>{item.name}</span><strong>{item.value}</strong><small>{total ? Math.round(item.value / total * 100) : 0}%</small></div>)}</div>
  </div>;
}
