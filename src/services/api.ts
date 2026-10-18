import type { Machine } from '@/data/machines';
import type { MachineAlert } from '@/data/alerts';

const baseUrl = (import.meta.env.VITE_API_BASE_URL || 'http://127.0.0.1:8000').replace(/\/$/, '');

export const apiConfig = {
  mode: 'backend' as const,
  baseUrl,
  endpoints: {
    machines: '/machines',
    alerts: '/alerts',
    prediction: '/predict-anomaly',
    analysis: '/analyze',
    workflow: '/workflow',
  },
};

type JsonRecord = Record<string, unknown>;

function isRecord(value: unknown): value is JsonRecord {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

function numberValue(value: unknown, field: string, optional = false): number | undefined {
  if (optional && (value === null || value === undefined || value === '')) return undefined;
  const number = typeof value === 'number' ? value : Number(value);
  if (!Number.isFinite(number)) throw new Error(`Backend returned an invalid ${field}.`);
  return number;
}

async function requestJson(path: string, signal?: AbortSignal, body?: unknown): Promise<unknown> {
  let response: Response;
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 10000);
  const abortRequest = () => controller.abort();
  signal?.addEventListener('abort', abortRequest, { once: true });
  try {
    response = await fetch(`${apiConfig.baseUrl}${path}`, {
      method: body === undefined ? 'GET' : 'POST',
      headers: body === undefined ? undefined : { 'Content-Type': 'application/json' },
      body: body === undefined ? undefined : JSON.stringify(body),
      signal: controller.signal,
    });
  } catch (error) {
    if (signal?.aborted) throw error;
    if (controller.signal.aborted) throw new Error(`Backend request ${path} timed out after 10 seconds.`);
    throw new Error(`Cannot reach the FactoryGuard backend at ${apiConfig.baseUrl}. Start the backend and try again.`);
  } finally {
    clearTimeout(timeout);
    signal?.removeEventListener('abort', abortRequest);
  }

  let payload: unknown;
  try {
    payload = await response.json();
  } catch {
    throw new Error(`Backend returned an invalid response for ${path}.`);
  }
  if (!response.ok) {
    const detail = isRecord(payload) && typeof payload.detail === 'string' ? payload.detail : `HTTP ${response.status}`;
    throw new Error(`Backend request ${path} failed: ${detail}`);
  }
  return payload;
}

function recordsFrom(payload: unknown, key: string): unknown[] {
  const records = Array.isArray(payload) ? payload : isRecord(payload) ? payload[key] : undefined;
  if (!Array.isArray(records)) throw new Error(`Backend response for ${key} must be an array.`);
  return records;
}

function normalizeMachine(value: unknown): Machine {
  if (!isRecord(value)) throw new Error('Backend returned an invalid machine record.');
  const id = value.id ?? value.machine_id;
  const name = value.name ?? value.machine_name;
  const status = value.status;
  if (id === undefined || typeof name !== 'string' || typeof status !== 'string') {
    throw new Error('Machine records require id, name, and status.');
  }
  if (!['Healthy', 'Warning', 'Critical'].includes(status)) {
    throw new Error(`Backend returned an unsupported status for ${String(id)}.`);
  }
  if (value.data_source !== 'demo' && value.data_source !== 'sensor') {
    throw new Error(`Backend did not identify the data source for machine ${String(id)}.`);
  }

  const updatedAt = value.updated_at ?? value.updatedAt ?? value.timestamp;
  return {
    id: String(id),
    name,
    type: typeof value.type === 'string' ? value.type : 'Machine',
    line: typeof value.line === 'string' ? value.line : 'Unassigned',
    temperature: numberValue(value.temperature ?? value.temp, 'temperature')!,
    vibration: numberValue(value.vibration ?? (isRecord(value.metrics) ? value.metrics.vibration : undefined), 'vibration', true),
    pressure: numberValue(value.pressure ?? (isRecord(value.metrics) ? value.metrics.pressure : undefined), 'pressure', true),
    rpm: numberValue(value.rpm, 'RPM', true),
    torque: numberValue(value.torque, 'torque', true),
    wear: numberValue(value.wear, 'wear', true),
    status: status as Machine['status'],
    updatedAt: typeof updatedAt === 'string' ? updatedAt : '',
    dataSource: value.data_source,
  };
}

function normalizeAlert(value: unknown): MachineAlert {
  if (!isRecord(value)) throw new Error('Backend returned an invalid alert record.');
  const id = numberValue(value.id ?? value.alert_id, 'alert ID');
  const machineId = value.machineId ?? value.machine_id;
  const severity = value.severity;
  const status = value.state ?? value.status;
  const description = value.description ?? value.message;
  const timestamp = value.timestamp ?? value.created_at ?? value.time;
  if (machineId === undefined || typeof severity !== 'string' || typeof status !== 'string') {
    throw new Error('Alert records require an ID, machine, severity, and state.');
  }
  if (!['Healthy', 'Warning', 'Critical'].includes(severity)) {
    throw new Error(`Backend returned an unsupported severity for alert ${id}.`);
  }
  if (!['Open', 'Acknowledged', 'Resolved'].includes(status)) {
    throw new Error(`Backend returned an unsupported state for alert ${id}.`);
  }
  return {
    id: id!,
    machineId: String(machineId),
    severity: severity as MachineAlert['severity'],
    description: typeof description === 'string' ? description : 'No alert message provided.',
    timestamp: typeof timestamp === 'string' ? timestamp : '',
    status: status as MachineAlert['status'],
  };
}

export interface MachineAnalysis {
  status: Machine['status'];
  message: string;
  analysis_method: string;
  prediction: { status: 'ANOMALY' | 'NORMAL' | 'UNKNOWN'; note?: string };
}

export const api = {
  async listMachines(signal?: AbortSignal) {
    const payload = await requestJson(apiConfig.endpoints.machines, signal);
    return recordsFrom(payload, 'machines').map(normalizeMachine);
  },

  async listAlerts(signal?: AbortSignal) {
    const payload = await requestJson(apiConfig.endpoints.alerts, signal);
    return recordsFrom(payload, 'alerts').map(normalizeAlert);
  },

  async analyze(machine: Machine, signal?: AbortSignal): Promise<MachineAnalysis> {
    const [analysisResult, predictionResult] = await Promise.allSettled([
      requestJson(apiConfig.endpoints.analysis, signal, {
        machine_id: machine.id,
        name: machine.name,
        temperature: machine.temperature,
        vibration: machine.vibration,
        pressure: machine.pressure,
        rpm: machine.rpm,
        torque: machine.torque,
        wear: machine.wear,
      }),
      machine.vibration === undefined || machine.pressure === undefined
        ? Promise.reject(new Error('Vibration and pressure are required for ML prediction.'))
        : requestJson(apiConfig.endpoints.prediction, signal, {
          temperature: machine.temperature,
          vibration: machine.vibration,
          pressure: machine.pressure,
        }),
    ]);

    if (analysisResult.status === 'rejected') throw analysisResult.reason;
    if (!isRecord(analysisResult.value) || typeof analysisResult.value.status !== 'string' || typeof analysisResult.value.message !== 'string') {
      throw new Error('Backend returned an invalid machine analysis.');
    }
    if (!['Healthy', 'Warning', 'Critical'].includes(analysisResult.value.status)) {
      throw new Error('Backend returned an unsupported analysis status.');
    }

    const prediction = predictionResult.status === 'fulfilled' && isRecord(predictionResult.value)
      ? predictionResult.value
      : undefined;
    const predictionStatus = prediction?.status;
    return {
      status: analysisResult.value.status as Machine['status'],
      message: analysisResult.value.message,
      analysis_method: typeof analysisResult.value.analysis_method === 'string' ? analysisResult.value.analysis_method : 'unknown',
      prediction: {
        status: predictionStatus === 'ANOMALY' || predictionStatus === 'NORMAL' ? predictionStatus : 'UNKNOWN',
        ...(typeof prediction?.note === 'string'
          ? { note: prediction.note }
          : predictionResult.status === 'rejected'
            ? { note: 'ML prediction is unavailable; no prediction was made.' }
            : {}),
      },
    };
  },

  async runWorkflow(input: {
    object_type: string;
    authorized: boolean;
    sensor_data: { temperature: number; vibration: number; pressure: number };
  }, signal?: AbortSignal) {
    return requestJson(apiConfig.endpoints.workflow, signal, input);
  },

  async chat() {
    throw new Error('No technician chat endpoint is configured on the backend.');
  },
};