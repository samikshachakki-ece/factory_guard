import { useState } from 'react';
import { useNavigate } from '@tanstack/react-router';
import { ScanLine, RefreshCw, TriangleAlert, MessageSquare } from 'lucide-react';
import { api, type MachineAnalysis } from '@/services/api';
import { Button } from '@/components/ui/button';
import { DemoBadge, MachineSelect, Status, PageHeading, EmptyState } from '@/components/factoryguard/shared';
import { useFactory, useTemperature, formatTimestamp } from '@/components/factoryguard/state';

export function AnalysisPage({ machineId }: { machineId: string }) {
  const navigate = useNavigate();
  const { machines, dataLoading } = useFactory();
  const machine = machines.find((item) => item.id === machineId);
  const [analysis, setAnalysis] = useState<MachineAnalysis | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const temp = useTemperature();

  async function run() {
    if (!machine) return;
    setLoading(true);
    setError('');
    setAnalysis(null);
    try {
      setAnalysis(await api.analyze(machine));
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : 'Backend analysis could not be loaded.');
    } finally {
      setLoading(false);
    }
  }

  return <>
    <PageHeading title="Machine Analysis" description="Run the backend rule-based assessment and check whether an ML prediction is available."><DemoBadge /></PageHeading>
    {!machine ? <EmptyState title={dataLoading ? 'Loading machine context...' : 'Machine data unavailable'} detail={dataLoading ? 'Waiting for the backend inventory.' : 'Select a machine returned by the backend before running analysis.'} /> : <>
      <div className="analysis-toolbar"><div><label>Machine context</label><MachineSelect value={machineId} onChange={(selected) => navigate({ to: '/analysis', search: { machine: selected } })} /></div><Button onClick={run} disabled={loading || dataLoading}><RefreshCw className={loading ? 'spin' : ''} />{loading ? 'Analyzing machine...' : 'Run backend analysis'}</Button></div>
      <div className="demo-notice"><ScanLine size={18} /><div><strong>BACKEND RESULTS</strong><p>Rule-based status comes from /analyze. A model prediction is shown only when the configured model returns one; absent models report UNKNOWN.</p></div></div>
      {error && <div role="alert" className="error-notice">{error}<Button variant="outline" size="sm" onClick={run}>Retry</Button></div>}
      <div className="analysis-readings">{[
        { label: 'Temperature', value: `${temp.convert(machine.temperature)} ${temp.unit}` },
        { label: 'Vibration', value: machine.vibration === undefined ? 'Unavailable' : `${machine.vibration} mm/s` },
        { label: 'Pressure', value: machine.pressure === undefined ? 'Unavailable' : `${machine.pressure} bar` },
      ].map((reading) => <div key={reading.label}><span>{reading.label}</span><strong>{reading.value}</strong></div>)}</div>
      {analysis && <>
        <section className="diagnostic-panel"><div className="panel-heading"><h2><TriangleAlert size={17} />Rule-based assessment</h2><Status status={analysis.status} /></div><div className="diagnostic-content"><p>{analysis.message}</p><p className="muted-small">Method: {analysis.analysis_method}. This is not a trained ML result.</p></div></section>
        <section className="diagnostic-panel"><div className="panel-heading"><h2><ScanLine size={17} />ML anomaly prediction</h2><span className={`event-status event-${analysis.prediction.status.toLowerCase()}`}>{analysis.prediction.status}</span></div><div className="diagnostic-content"><p>{analysis.prediction.status === 'UNKNOWN' ? analysis.prediction.note ?? 'No prediction was made.' : analysis.prediction.status === 'ANOMALY' ? 'The configured model reported an anomaly.' : 'The configured model reported no anomaly.'}</p></div></section>
      </>}
      <div className="analysis-bottom"><span>{analysis ? `Backend response · ${formatTimestamp(machine.updatedAt)}` : 'Analysis has not been run.'}</span><Button asChild variant="outline"><a href="/technician" onClick={(event) => { event.preventDefault(); navigate({ to: '/technician', search: { machine: machineId } }); }}><MessageSquare />Technician demo</a></Button></div>
    </>}
  </>;
}
