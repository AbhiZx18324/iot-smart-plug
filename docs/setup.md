# Local Development Setup: Data Generation & ML Pipeline

This guide is for running the sensor simulation and ml services so as to fetch data for DB ingestion, dashboard display, etc. It explains how to locally spin up the MQTT broker, the Machine Learning inference engine, and the simulated smart plugs.

By following these steps, you will establish a live stream of telemetry and anomaly data hitting `localhost:1884`, which your Ingestion Service and Dashboard can immediately consume.

### Step 1: Start the Core Infrastructure

First, spin up the MQTT Broker and the ML Inference Service from *`iot-smart-plug/`* directory. They communicate over a dedicated internal Docker network (`smartplug_net`).

```bash
docker compose up --build -d
```

*Note: Once running, the ML service will silently wait for telemetry to arrive on `smartplug/+/telemetry`.*

### Step 2: Spin Up Simulated Smart Plugs

You can dynamically inject appliances into the network to generate data. The `--rm` flag ensures the container is cleanly deleted the moment you turn the appliance off, keeping your Docker environment clean.

**Usage Syntax:**

```bash
python -m sensor_simulation.mqtt_publisher "<PlugID>" "<ApplianceName>" "<OptionalFaultMode>"

```

**Scenario A: Turn ON a Healthy Appliance (e.g., a Fridge)**<br>
This generates standard 10Hz telemetry. The ML service will classify it and publish normal inference payloads.

```bash
docker run --rm -d \
  --name sim_fridge \
  --network smartplug_net \
  -e MQTT_BROKER="mqtt_broker" \
  smartplug-simulator \
  python -m sensor_simulation.mqtt_publisher "plug_01_fridge" "Fridge"

```

**Scenario B: Turn ON a Faulty Appliance (Anomaly Injection)**<br>
This simulates an appliance experiencing hardware degradation. The ML service will classify the base appliance but will flag `is_anomaly: true` and output a high `anomaly_score` for the dashboard to catch.

```bash
docker run --rm -d \
  --name sim_faulty_fan \
  --network smartplug_net \
  -e MQTT_BROKER="mqtt_broker" \
  smartplug-simulator \
  python -m sensor_simulation.mqtt_publisher "plug_02_fan" "Fan" "bearing_wear"

```

### Step 3: Graceful Shutdown (Sending the "OFF" Signal)

To turn off an appliance, we send a `SIGINT` (KeyboardInterrupt) to the container. This allows the simulator to cleanly execute its shutdown sequence and publish a final `"relay": "OFF"` payload.

**Backend Note:** You *must* use this command to stop the plugs so your database receives the explicit `OFF` message to close the usage session.

```bash
# Turn off the Fridge
docker kill --signal="SIGINT" sim_fridge

# Turn off the Faulty Fan
docker kill --signal="SIGINT" sim_faulty_fan

```

### Step 4: Tear Down the Infrastructure

Once you are done testing your DB writes or dashboard components, cleanly shut down the MQTT broker, the ML service, and the custom Docker network:

```bash
docker compose down

```