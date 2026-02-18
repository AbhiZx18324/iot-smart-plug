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

---

### 11. Backend Setup & Run Instructions (InfluxDB v2)

The backend ingestion service routes validated JSON payloads from the MQTT broker into a time-series database for live monitoring and future ML feature extraction.

#### Prerequisites
* Python 3.8+
* [Homebrew](https://brew.sh/) (for Mac users)

#### Step 1: Install Infrastructure (Mac / Homebrew)
We use Mosquitto as the MQTT broker and **InfluxDB v2** as the time-series database. 
*(Note: We specifically use v2 to retain the built-in Data Explorer web UI).*

```bash
# Install Mosquitto
brew install mosquitto
brew services start mosquitto

# Install InfluxDB v2 (specifically version 2, not v3)
brew install influxdb@2
```

#### Step 2: Start the Database Server

Because `influxdb@2` is a versioned Homebrew package, it is "keg-only". Start it by running its direct path in a dedicated terminal window (leave it running):

**For Apple Silicon (M1/M2/M3):**

```bash
/opt/homebrew/opt/influxdb@2/bin/influxd
```

**For Intel Macs:**

```bash
/usr/local/opt/influxdb@2/bin/influxd
```

#### Step 3: Configure InfluxDB & Security

1. Open a browser and navigate to `http://localhost:8086`.
2. Create an initial admin user and password.
3. **CRITICAL:** Set the Initial Organization Name to `smartplug_org` and Bucket Name to `smartplug_data`.
4. Navigate to **Load Data (Up Arrow Icon) -> API Tokens** and copy your admin token.
5. In the root of this project, create a `.env` file and add your token:
```env
INFLUX_TOKEN=your-copied-token-here
```



#### Step 4: Python Dependencies

Install the required libraries for the backend and simulator:

```bash
pip install paho-mqtt influxdb-client python-dotenv
```

*(Note: Ensure your code uses `BROKER_PORT = 1883` to align with the Homebrew Mosquitto default).*

#### Step 5: Run the Pipeline

Open two separate terminal windows (ensure your Python virtual environment is active in both).

**Terminal 1 (Start the Listener):**

```bash
python backend/ingestion_service.py
```

**Terminal 2 (Start the Simulator):**

```bash
python sensor-simulation/mqtt_publisher.py
```

#### Step 6: View Live Data

1. Go to `http://localhost:8086` and click the **Data Explorer** icon.
2. In the Query Builder, select:
* **FROM:** `smartplug_data`
* **Filter 1:** `_measurement` -> `telemetry`
* **Filter 2:** `_field` -> `power_active`


3. Click **Submit**.
4. To stream data live, change the time window to **Past 5m**, click the dropdown arrow next to the Auto-Refresh button, and select **5s**.

---