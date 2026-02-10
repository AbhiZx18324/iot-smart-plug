# Smart Plug Data Schema Contract (v1.0)

This schema defines the interface between the **Virtual Smart Plug**, **Data Ingestion**, **ML Pipeline**, **Web Dashboard**, and **Digital Twin**. 

> [!IMPORTANT]
> **Governance:** No fields are to be added or removed without a formal team discussion.

---

## 1. Message Transport
* **Protocol:** MQTT
* **Topic Format:** `smartplug/{plug_id}/telemetry`
* **Example:** `smartplug/plug_001/telemetry`

---

## 2. Telemetry Message (JSON Payload)
This is the raw data sent by the Virtual Smart Plug.

```json
{
  "plug_id": "plug_001",
  "timestamp": "2026-02-10T14:05:23.531Z",
  "electrical": {
    "voltage_rms": 230.2,
    "current_rms": 0.35,
    "power_active": 80.5,
    "frequency": 50.0
  },
  "state": {
    "relay": "ON",
    "appliance_truth": "fan"
  }
}
```

---

## 3. Field Definitions

### Identification & Timing

| Field | Type | Description |
| --- | --- | --- |
| `plug_id` | **string** | Unique device identity. |
| `timestamp` | **ISO-8601** | UTC time alignment for cross-system synchronization. |


### Electrical Measurements

| Field | Units | Meaning |
| --- | --- | --- |
| `voltage_rms` | **Volts** | RMS line voltage. |
| `current_rms` | **Amps** | RMS current. |
| `power_active` | **Watts** | Real power consumed. |
| `frequency` | **Hz** | Mains frequency. |

> **Note on RMS:** Sensors compute RMS internally to avoid raw waveform bloat while remaining sufficient for **NILM** (Non-Intrusive Load Monitoring) at demo scale.


### State Metadata

| Field | Purpose |
| --- | --- |
| `relay` | Current physical state (**ON / OFF**). |
| `appliance_truth` | Ground truth label. Only present in simulation/training. |

---

## 4. Machine Learning Feature Window

**Derived Downstream** — *Not sent via MQTT.*

ML consumes processed windows rather than raw telemetry to identify patterns and anomalies:

```json
{
  "plug_id": "plug_001",
  "features": {
    "mean_power": 82.1,
    "std_power": 3.2,
    "max_power": 90.4,
    "turn_on_spike": 120.6
  }
}

```

---

## 5. Database Mapping (Backend Schema)

### Time-Series Table (e.g., InfluxDB/Timescale)

| Column | Type |
| --- | --- |
| `plug_id` | **TEXT** |
| `timestamp` | **TIMESTAMP** |
| `voltage_rms` | **FLOAT** |
| `current_rms` | **FLOAT** |
| `power_active` | **FLOAT** |
| `frequency` | **FLOAT** |

### Metadata Table

*Relational storage for device state and labels.*

| Column | Type |
| --- | --- |
| `plug_id` | **TEXT** |
| `relay` | **TEXT** |
| `appliance_truth` | **TEXT** |

---

## 6. Validation Rules

The Backend **must** reject messages if:

1. Any **required field** is missing.
2. **Voltage** is outside 180-260 Volts.
3. **Frequency** is outside 49-51 Hz.
4. **Power** is negative.

