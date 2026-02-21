# Smart Plug Sensor Simulation Engine

This module is the data-generation backbone for our IoT analytics pipeline. It simulates 10 Hz high-resolution electrical telemetry (Voltage, Current, Active Power) for various household appliances and publishes the data streams to a local MQTT broker.

The simulated payloads are specifically designed to be ingested by our downstream Machine Learning service (Random Forest feature extractor), which classifies the active appliance based on its electrical signature.

## Directory Structure & File Overview

* **`behavior_models.py`**: The core statistical simulation logic. Contains the "Archetype" models that define the specific startup transients, steady-state power, and high-frequency noise profiles of different appliance categories.
* **`signal_generator.py`**: Maps specific household items (e.g., "Fan", "Fridge") to their base behavior models. Calculates the instantaneous Voltage (simulating grid fluctuations) and Current based on the active power draw.
* **`usage_profiles.py`**: Defines the realistic human-interaction parameters (mean ON time, mean OFF time) for each appliance type.
* **`usage_scheduler.py`**: Uses an exponential distribution to simulate realistic, random human interaction with the smart plugs over long periods.
* **`mqtt_publisher.py`**: A standalone script to simulate a single smart plug and continuously stream its telemetry to `localhost:1884`.
* **`test_multi_sockets.py`**: A concurrent stress-test script that spawns 5 separate virtual smart plugs simultaneously to test the pipeline's parallel processing capabilities.

## Architectural Decision: The "Real Life vs. Reel Life" Gap

One of the major engineering challenges in this project was bridging the gap between our simulated data ("Reel Life") and the Machine Learning model trained on the PLAID dataset ("Real Life").

**The Problem:**
The PLAID dataset contains recordings of physical appliances with real hardware quirks (e.g., motor brush friction, degrading compressors, grid harmonics). When we initially tried to simulate appliances using wide Gaussian distributions based on the overall dataset variance, our Random Forest classifier completely failed. For example, applying heavy random noise to a washing machine simulation caused our feature extractor's `oscillations` and `max_delta` metrics to spike, causing the model to misclassify it as a chaotic Thermal load.

**Our Solution (Appliance Archetypes):**
Instead of allowing the simulator to randomly drift, we reverse-engineered the Random Forest's decision boundaries. We locked our simulated appliances into **Statistical Archetypes**—forcing the simulated signals to sit dead-center in the model's learned feature clusters.

* **`ArchetypeLighting` (e.g., Bulbs):** Locked to 35W with near-zero noise. Prevents false `oscillations` that confuse it with small motors.
* **`ArchetypeSmallMotor` (e.g., Fans, Laptops):** Locked to 85W with a smooth, 4W mechanical sine-wave ripple. This safely keeps it out of the HVAC decision zone (>117W).
* **`ArchetypeHVAC` (e.g., Fridges, ACs):** Centered at 160W with moderate inrush spikes, avoiding the massive variance of 240V central air units that the model wasn't trained on.
* **`ArchetypeLaundry` (e.g., Washing Machines):** Locked to 528W with precisely 45W of high-frequency noise, perfectly mimicking the PLAID dataset's snapshot of a spinning drum without inducing macro-cycle range collapse.
* **`ArchetypeThermal` (e.g., Heaters):** Locked to 1200W with highly stable power (2W noise), fulfilling the model's expectation of a pure resistive heating element.

## How to Run

### 1. Prerequisite

Ensure your MQTT broker (e.g., Mosquitto) is running on `localhost:1884`.

### 2. Single Appliance Simulation

To spin up a single plug simulating human usage of a specific appliance:

```bash
python mqtt_publisher.py "Fan"

```

*Supported appliances: "Fan", "Laptop", "Incandescent Light Bulb", "Heater", "Microwave", "Hairdryer", "Fridge", "Air Conditioner", "Washing Machine", "Compact Fluorescent Lamp".*

### 3. Concurrent Pipeline Test

To test the downstream ML service's ability to handle multiple isolated data streams simultaneously, run the multi-socket stress test. This turns on 5 distinct appliances at once:

```bash
python test_multi_sockets.py

```

## 📡 Payload Format

The simulator publishes data at 10 Hz to `smartplug/{plug_id}/telemetry` in the following JSON format:

```json
{
  "plug_id": "plug_01_motor",
  "timestamp": "2026-02-21T08:45:16.211121+00:00",
  "electrical": {
    "voltage_rms": 228.80,
    "current_rms": 0.37,
    "power_active": 84.66,
    "frequency": 50.0
  },
  "state": {
    "relay": "ON",
    "appliance_truth": "Fan"
  }
}

```