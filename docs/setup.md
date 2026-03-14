# Local Development Setup: Quickstart (Pre-built)

This guide is for running the sensor simulation and ML services to fetch data for DB ingestion, dashboard display, etc. It uses pre-built Docker images from Docker Hub, meaning **no compilation or dependencies are required.**

By following these steps, you will establish a live stream of telemetry and anomaly data hitting `localhost:1884`.

### Step 1: Start the Core Infrastructure

Ensure you have the `docker-compose.yml` and `mosquitto.conf` files in your directory. Spin up the MQTT Broker and the ML Inference Service. They communicate over a dedicated internal Docker network (`smartplug_net`).

```bash
docker compose up -d

```

*Note: Docker will automatically pull the ML service from the cloud. Once running, it silently waits for telemetry to arrive on `smartplug/+/telemetry`.*

### Step 2: Spin Up Simulated Smart Plugs

You can dynamically inject appliances into the network to generate data. The `--rm` flag ensures the container is cleanly deleted the moment you turn the appliance off.

**Usage Syntax:**

```bash
docker run --rm -d --name <ContainerName> --network smartplug_net -e MQTT_BROKER="mqtt_broker" abhizx18324/simulator-service:v1 python -m sensor_simulation.mqtt_publisher "<PlugID>" "<ApplianceName>" "<OptionalFaultMode>"

```

**Scenario A: Turn ON a Healthy Appliance (e.g., a Fridge)**
This generates standard 10Hz telemetry. The ML service will classify it and publish normal inference payloads.

```bash
docker run --rm -d \
  --name sim_fridge \
  --network smartplug_net \
  -e MQTT_BROKER="mqtt_broker" \
  abhizx18324/simulator-service:v1 \
  python -m sensor_simulation.mqtt_publisher "plug_01_fridge" "Fridge"

```

**Scenario B: Turn ON a Faulty Appliance (Anomaly Injection)**
This simulates an appliance experiencing hardware degradation. The ML service will flag `is_anomaly: true` and output a high `anomaly_score`.

```bash
docker run --rm -d \
  --name sim_faulty_fan \
  --network smartplug_net \
  -e MQTT_BROKER="mqtt_broker" \
  abhizx18324/simulator-service:v1 \
  python -m sensor_simulation.mqtt_publisher "plug_02_fan" "Fan" "bearing_wear"

```

### Step 3: Graceful Shutdown (Sending the "OFF" Signal)

To turn off an appliance, send a `SIGINT` (KeyboardInterrupt) to the container. This allows the simulator to cleanly execute its shutdown sequence and publish a final `"relay": "OFF"` payload.

**Backend Note:** You *must* use this command to stop the plugs so your database receives the explicit `OFF` message to close the usage session.

```bash
# Turn off the Fridge
docker kill --signal="SIGINT" sim_fridge

# Turn off the Faulty Fan
docker kill --signal="SIGINT" sim_faulty_fan

```

### Step 4: Tear Down the Infrastructure

Once you are done testing, cleanly shut down the MQTT broker, the ML service, and the custom Docker network:

```bash
docker compose down

```
