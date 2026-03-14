# Advanced: Building from Source

This guide is for developers who are actively modifying the ML models or the sensor simulation logic and need to build the Docker images locally from source code. 

### Step 1: Start the Core Infrastructure (Build Mode)

First, navigate to the root `iot-smart-plug/` directory. Spin up the MQTT Broker and the ML Inference Service, forcing Docker to rebuild the ML image from your local `ml/` directory.

```bash
docker compose up --build -d

```

### Step 2: Build the Simulator Image Locally

Before spinning up appliances, you must build the simulator image from your local `sensor_simulation/` directory.

```bash
cd sensor_simulation
docker build -t smartplug-simulator .

```

### Step 3: Spin Up Simulated Smart Plugs

You can now dynamically inject appliances using your locally built `smartplug-simulator` image.

**Turn ON a Healthy Appliance:**

```bash
docker run --rm -d \
  --name sim_fridge \
  --network smartplug_net \
  -e MQTT_BROKER="mqtt_broker" \
  smartplug-simulator \
  python -m sensor_simulation.mqtt_publisher "plug_01_fridge" "Fridge"

```

**Turn ON a Faulty Appliance:**

```bash
docker run --rm -d \
  --name sim_faulty_fan \
  --network smartplug_net \
  -e MQTT_BROKER="mqtt_broker" \
  smartplug-simulator \
  python -m sensor_simulation.mqtt_publisher "plug_02_fan" "Fan" "bearing_wear"

```

### Step 4: Graceful Shutdown

Send a `SIGINT` to gracefully shut down the appliances and publish the explicit `OFF` state to the pipeline:

```bash
docker kill --signal="SIGINT" sim_fridge

```

### Step 5: Tear Down

```bash
docker compose down

```
