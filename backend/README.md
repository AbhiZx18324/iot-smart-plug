## Backend Ingestion Module – Acceptance Criteria

### 1. Overview

The backend module is responsible for ingesting telemetry from virtual smart plugs via MQTT, validating message structure, and persisting data for downstream analytics and visualization.

The backend **must not** perform ML inference or feature extraction at this stage.

---

### 2. MQTT Subscription Requirements

* Broker: Mosquitto
* Port: `1883` (development)
* Subscription topic:

  ```
  smartplug/+/telemetry
  ```
* Backend must act as an MQTT **client subscriber**

---

### 3. Message Schema Compliance

Backend must accept messages **only** if they strictly conform to the following schema:

```json
{
  "plug_id": "string",
  "timestamp": "ISO-8601 UTC",

  "electrical": {
    "voltage_rms": "float",
    "current_rms": "float",
    "power_active": "float",
    "frequency": "float"
  },

  "state": {
    "relay": "ON | OFF",
    "appliance_truth": "string (optional)"
  }
}
```

Messages failing validation must be logged and discarded.

---

### 4. Semantic Expectations

* `relay = "ON"` → device actively consuming power
* `relay = "OFF"` → device explicitly turned off
* Backend must **not infer OFF from silence**
* OFF messages will be explicitly published with `power_active = 0.0`

---

### 5. Validation Rules

Backend must reject messages if:

* Any required field is missing
* `voltage_rms < 180` or `> 260`
* `frequency` not in `[49, 51]`
* `power_active < 0`

---

### 6. Data Storage Requirements

#### Time-Series Data

Backend must store:

* `plug_id`
* `timestamp`
* `voltage_rms`
* `current_rms`
* `power_active`
* `frequency`

#### State Metadata

Backend must store:

* `plug_id`
* `timestamp`
* `relay`
* `appliance_truth` (if present)

Database technology is flexible (SQL / time-series DB).

---

### 7. Multiple Device Support

Backend must correctly ingest:

* Multiple plugs publishing simultaneously
* Distinct `plug_id` values
* Interleaved message streams

---

### 8. Reference Implementation

A minimal reference MQTT subscriber is available at:

```
backend/mqtt_subscriber.py
```

Backend implementation may extend this directly.

---

### 9. Out of Scope (For This Phase)

Backend must NOT:

* Perform ML classification
* Perform anomaly detection
* Aggregate energy statistics
* Handle authentication / security

These are future phases.

---

### 10. Definition of Done

The backend ingestion module is considered complete when:

* Messages are reliably ingested from MQTT
* Invalid messages are rejected with logs
* OFF events are correctly recorded
* Data is persisted and queryable
* No schema assumptions are violated