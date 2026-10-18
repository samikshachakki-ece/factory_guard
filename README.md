# FactoryGuard

Industrial machine monitoring and predictive-maintenance dashboard prototype, built for an
AMD engineer workflow: monitor machines, inspect sensor readings, review failure analysis,
and ask an AI technician for troubleshooting help.

> **Prototype data.** The active dashboard reads the FastAPI backend. The current backend returns
> clearly identified seeded demo machine readings and active alerts; it is not connected to
> physical factory sensors. Backend failures are shown in the UI rather than replaced with data
> that looks live.

## Tech stack

- TanStack Start v1 (React 19, file-based routing, SSR)
- TypeScript, Vite 8
- Tailwind CSS v4 (semantic design tokens in `src/styles.css`)
- shadcn/ui primitives, Recharts, lucide-react
- Vitest + Testing Library

## Windows PowerShell setup

Open this project folder in VS Code (`File` → `Open Folder`) or navigate to it in PowerShell. Use Python 3.10+ and Node.js 20+.
The checked-in `package-lock.json` makes npm the recommended frontend package manager.

1. Create and activate a Python virtual environment:

  ```powershell
  py -3 -m venv .venv
  .\.venv\Scripts\Activate.ps1
  ```

  If PowerShell blocks activation, run `Set-ExecutionPolicy -Scope Process -ExecutionPolicy Bypass`, then activate again.

2. Install backend dependencies:

  ```powershell
  python -m pip install --upgrade pip
  python -m pip install -r requirements.txt
  ```

3. Start FastAPI on `127.0.0.1:8000`:

  ```powershell
  python -m uvicorn backend.main:app --reload --host 127.0.0.1 --port 8000
  ```

  Keep this terminal open. Verify `http://127.0.0.1:8000/health` and inspect interactive API documentation at `http://127.0.0.1:8000/docs`.

4. Open a second PowerShell terminal in the same project folder and install frontend dependencies:

  ```powershell
  npm install
  ```

5. (Optional) Set the backend URL for this terminal, then start the TanStack/Vite frontend:

  ```powershell
  $env:VITE_API_BASE_URL = "http://127.0.0.1:8000"
  npm run dev
  ```

6. Open `http://127.0.0.1:8080` in your browser. The Vite server is pinned to this port so it matches the backend CORS allowlist.

The API URL defaults to `http://127.0.0.1:8000`. To persist configuration, copy `.env.example` to `.env` and adjust `VITE_API_BASE_URL` or `FRONTEND_ORIGINS`. Do not put API keys in frontend variables; values prefixed with `VITE_` are exposed to the browser.

Other scripts:

```sh
npm run build      # production build
npm run preview    # serve the production build
npm run test       # vitest run
npm run lint       # eslint
npm run format     # prettier --write
```

## Pages

| Route | View |
| --- | --- |
| `/` | Overview — fleet health, KPIs, attention list, sensor charts |
| `/machines` | Searchable and filterable machine inventory |
| `/machines/:machineId` | Machine detail — backend sensor snapshots and related alerts |
| `/alerts` | Backend active-alert feed; status edits are session-local |
| `/analysis` | Backend rule-based analysis plus optional ML prediction |
| `/technician` | Disabled demo transcript; no chat API is configured |
| `/settings` | Display preferences (units, theme), stored in the browser only |

## Project structure

```text
src/
  data/         Clearly labelled legacy sample fixtures and technician transcript
  services/     api.ts — centralized FastAPI adapter and response validation
  features/     One module per workspace view (overview, machines, alerts, analysis, technician, settings)
  components/
    factoryguard/  Shared app UI: shell, machine table, charts, panels, state helpers
    ui/            shadcn/ui primitives
    ai-elements/   Chat transcript + composer primitives
  routes/       File-based routes (TanStack Start); __root.tsx is the app shell
  hooks/ lib/   Small shared utilities
```

### Connecting a real backend

`src/services/api.ts` is the centralized HTTP adapter. It reads `VITE_API_BASE_URL` and calls
`GET /machines`, `GET /alerts`, `POST /analyze`, and `POST /predict-anomaly`. The overview refresh
button reloads inventory and alerts. The machine and alert pages show backend errors and empty
responses rather than substituting local mock records.

The seeded backend responses include `data_source: "demo"` and a sample timestamp. Replace those
fixtures with an approved sensor adapter before using this dashboard for operational decisions.
Machine trend history is not provided by the API, so charts show current snapshots, not simulated
historical telemetry. Alert acknowledgement is local to the current browser session because no
alert-update endpoint exists. Technician chat is a labelled, disabled demo because no chat route
exists. The backend `/workflow` route has no matching form in the current UI; the API adapter
exposes the route, but the dashboard does not submit fabricated workflow inputs.

If the ML model file is missing, `/predict-anomaly` returns `UNKNOWN` and a note that no prediction
was made. `/analyze` is a rule-based baseline, not a trained model result.

## Notes

- Display preferences live in browser storage only; alert edits and the single demo conversation
  are session state. No database or auth is wired up.
- `src/routeTree.gen.ts` is generated by the router plugin — do not edit it by hand.
- This is a frontend prototype: nothing here is production monitoring.

## Troubleshooting

- **Backend URL is unreachable:** Keep the Uvicorn terminal running and confirm `http://127.0.0.1:8000/health` opens. The dashboard displays connection errors instead of sample fallbacks.
- **CORS error:** Start the active Vite app on port `8080`. If you change the port or host, add its exact origin to `FRONTEND_ORIGINS` in `.env` (comma-separated) and restart Uvicorn.
- **PowerShell will not activate `.venv`:** Run `Set-ExecutionPolicy -Scope Process -ExecutionPolicy Bypass` in that terminal, then activate again.
- **`fastapi` or `uvicorn` is missing:** Activate `.venv` before running `python -m pip install -r requirements.txt` and starting the backend.
- **Anomaly prediction shows `UNKNOWN`:** The ML model file is missing or unavailable. The backend has not made a model prediction; `/analyze` still reports its separate rule-based baseline.
- **No trend history or technician replies:** The current backend does not expose historical telemetry or technician chat routes. The dashboard identifies those capabilities instead of generating pretend live results.
