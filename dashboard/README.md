# Smart Plug Web Dashboard

## Overview
The Dashboard is the user-facing component of the IoT Smart Plug system. It provides real-time visualization of electrical telemetry, historical power consumption analytics, and appliance recognition status.

---

## Key Features
- **Live Monitoring:** Real-time streaming of `voltage_rms`, `current_rms`, and `power_active`.
- **Appliance Status:** Visual indicator of the current appliance identified by the ML Inference service.
- **Historical Trends:** Interactive charts to view power usage over time (Past 1h, 24h, 7d).
- **Device Control:** Interface to view the current relay state (`ON`/`OFF`).
- **Anomaly Alerts:** Visual notifications when the system detects abnormal power signatures.

---

## Tech Stack (Proposed)
- **Frontend:** React.js or Next.js
- **Styling:** Tailwind CSS
- **Charts:** Chart.js or Recharts
- **Data Fetching:** InfluxDB Client (for time-series) & MQTT.js (for live updates)

---

## Integration Points
1. **InfluxDB:** Queries historical telemetry from the `smartplug_data` bucket.
2. **MQTT Broker:** Subscribes to `smartplug/+/telemetry` for live sensor updates and `smartplug/+/inference` for appliance classification results.

---

## Setup Instructions

### Prerequisites
- Node.js (v16 or higher)
- npm or yarn

### Installation
1. Navigate to the dashboard directory:
   ```bash
   cd dashboard
   ```
2. Install dependencies:
   ```bash
   npm install
   ```
3. Configure environment variables:
   Create a `.env.local` file:
   ```env
   VITE_INFLUX_URL=http://localhost:8086
   VITE_INFLUX_TOKEN=your-token-here
   VITE_INFLUX_ORG=smartplug_org
   VITE_INFLUX_BUCKET=smartplug_data
   ```
   *(Note: Mosquitto must be configured to allow WebSockets on port 9001 for browser access).*

### Running the Dashboard
```bash
npm run dev
```
The dashboard will be available at `http://localhost:5173`.

---