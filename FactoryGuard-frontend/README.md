# FactoryGuard Frontend (HTML + CSS + JavaScript)

This is a beginner-friendly, standalone frontend demo. It does not require React, npm, a backend, or a database.

## Files
- `index.html` — all page layouts
- `styles.css` — colors, layout, responsive/mobile styling
- `app.js` — sample data, navigation, filters, charts, alerts, chat, and interactions

## Run it
1. Extract `FactoryGuard-frontend.zip`.
2. Open the extracted `FactoryGuard-frontend` folder.
3. Double-click `index.html` to open it in Chrome or Edge.
4. If you use VS Code, install the **Live Server** extension, right-click `index.html`, and choose **Open with Live Server**.

## Included pages
- Overview dashboard
- Machines list, search, status/line filters, machine detail modal, add demo machine
- Alerts list, severity/state filters, acknowledge and resolve actions
- Analytics charts and CSV export
- Technician chat demo
- Settings and reset demo data

## Important
All machine readings, alerts, metrics, and messages are demo/sample data. The page does not read actual factory sensors and is not connected to your backend. Browser refresh resets data changed during the session. To use live data later, connect `app.js` to your backend API with `fetch()` and configure the backend's CORS settings.
