import { mockMachines } from '@/data/machines';
import { mockAlerts } from '@/data/alerts';
import { mockAnalysis } from '@/data/analysis';
import { mockSensorHistory, type Period } from '@/data/sensors';

export const apiConfig = {
  mode: 'backend' as 'demo' | 'backend',
  baseUrl: 'http://127.0.0.1:8000',
  endpoints: {
    machines: '/api/machines',
    machine: (id: string) => `/api/machines/${encodeURIComponent(id)}`,
    technician: '/api/technician/chat',
    analysis: '/analyze',
  },
};

function getMachine(id: string) {
  const machine = mockMachines.find((m) => m.id === id);

  if (!machine) {
    throw new Error('Machine not found in demo inventory.');
  }

  return machine;
}

export const api = {
  listMachines: () => mockMachines,

  getMachine,

  listAlerts: () => mockAlerts,

  getHistory: (id: string, period: Period) =>
    mockSensorHistory(getMachine(id), period),

  async analyze(id: string) {
    const machine = getMachine(id);
    const baseDemo = mockAnalysis(machine);

    if (apiConfig.mode === 'backend') {
      try {
        const response = await fetch(
          `${apiConfig.baseUrl}${apiConfig.endpoints.analysis}`,
          {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              machine_id: machine.id,
              name: machine.name,
              temperature: machine.temperature,
              rpm: machine.rpm,
              torque: machine.torque,
              wear: machine.wear,
            }),
          }
        );

        if (!response.ok) {
          throw new Error(
            `Machine analysis failed with HTTP ${response.status}`
          );
        }

        const backendData = await response.json();

        const severity =
          backendData.status === 'Critical'
            ? 'Critical'
            : backendData.status === 'Warning'
              ? 'Warning'
              : 'Healthy';

        return {
          ...baseDemo,
          severity,
          recommendation:
            backendData.message || baseDemo.recommendation,
        };
      } catch (err) {
        console.error(
          'Backend analysis failed; using demo analysis:',
          err
        );
      }
    }

    // Fallback keeps the UI usable if the backend is unavailable.
    await new Promise((resolve) => setTimeout(resolve, 750));

    return baseDemo;
  },
};