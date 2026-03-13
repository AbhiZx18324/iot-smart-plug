# Smart Plug Sensor Simulation Engine

This module acts as the **digital twin of a smart plug** in our IoT analytics pipeline. It generates realistic electrical telemetry streams (Voltage, Current, Active Power) at **10 Hz resolution** for various household appliances and publishes them to a local MQTT broker.

The simulated signals mimic the output of real low-cost smart plugs and are specifically designed to be consumed by the downstream **Machine Learning inference service**, which extracts statistical features and classifies the electrical load behavior.

The simulator also supports **controlled fault injection**, enabling realistic anomaly scenarios for testing the anomaly detection pipeline.

---

# Directory Structure & File Overview

* **`behavior_models.py`**
  Contains the statistical **appliance archetypes** that generate realistic electrical power signatures for different appliance categories.

* **`signal_generator.py`**
  Maps real-world appliances (e.g., *Fan*, *Fridge*) to their corresponding archetype models and generates instantaneous electrical telemetry.

* **`usage_profiles.py`**
  Defines realistic human usage behavior such as average ON/OFF durations.

* **`usage_scheduler.py`**
  Uses exponential distributions to simulate stochastic human interaction with appliances.

* **`mqtt_publisher.py`**
  Standalone simulator that spins up a virtual smart plug and streams telemetry to the MQTT broker.

* **`test_multi_sockets.py`**
  Stress-test script that launches multiple simulated smart plugs simultaneously to test the pipeline’s concurrency handling.

---

# Architectural Decision: The "Real Life vs. Reel Life" Gap

One of the primary engineering challenges was bridging the gap between **simulated signals ("Reel Life")** and the **PLAID dataset recordings ("Real Life")** used to train the ML classifier.

## The Problem

The PLAID dataset contains recordings of real appliances operating in uncontrolled environments. These recordings contain hardware imperfections such as:

* motor brush friction
* compressor degradation
* electrical harmonics
* voltage instability

When we initially simulated appliances using wide Gaussian distributions derived from dataset variance, our Random Forest classifier failed catastrophically.

For example:

* Adding high noise to washing machine simulations caused the `oscillations` and `max_delta` features to spike.
* The model consequently misclassified the appliance as a **Thermal load**.

This demonstrated that **statistical similarity alone was insufficient** to reproduce the feature clusters learned by the classifier.

---

# Our Solution: Appliance Archetypes

Instead of allowing the simulator to randomly drift through the statistical distribution, we reverse engineered the **Random Forest decision boundaries** and constructed **statistical archetypes**.

Each archetype represents the **center of the feature cluster** learned by the classifier.

This guarantees that simulated signals remain within the classifier's expected behavioral envelope.

## Archetype Definitions

### ArchetypeLighting (Bulbs)

* Mean Power: **35 W**
* Noise: **near zero**

This prevents artificial oscillations that would otherwise resemble small motors.

---

### ArchetypeSmallMotor (Fans)

* Mean Power: **85 W**
* Ripple: **±4 W sinusoidal mechanical oscillation**

This ripple simulates mechanical vibration and ensures the signal remains distinguishable from static resistive loads.

---

### ArchetypeHVAC (Fridge / AC)

* Mean Power: **160 W**
* Noise: **1.5 W**

This avoids the extremely large variance seen in industrial HVAC units that were not represented in the training dataset.

---

### ArchetypeLaundry (Washing Machine)

* Mean Power: **528 W**
* Noise: **45 W**

This matches the PLAID dataset snapshot of a spinning drum without causing macro power range collapse.

---

### ArchetypeThermal (Heaters)

* Mean Power: **1200 W**
* Noise: **2 W**

This simulates the extremely stable behavior of resistive heating elements.

---

# Fault & Anomaly Simulation

To evaluate the anomaly detection module, the simulator supports **controlled fault injection**.

Instead of changing the appliance class entirely, faults introduce **statistical deviations within the same behavioral category**, allowing the anomaly detection system to identify abnormal behavior while the classifier still recognizes the appliance type.

## Why Fault Injection Matters

Real appliances rarely fail abruptly. Instead they degrade gradually due to:

* mechanical wear
* electrical faults
* thermal damage
* environmental fluctuations

These failures manifest as **changes in signal statistics**, not necessarily as changes in appliance type.

By injecting these deviations into the simulation, we can test whether the anomaly detection system correctly detects abnormal behavior.

---

# Supported Fault Modes

| Appliance Class         | Fault Mode               | Effect                                    |
| ----------------------- | ------------------------ | ----------------------------------------- |
| SMALL_MOTOR_ELECTRONICS | `bearing_wear`           | Increased ripple amplitude and power draw |
| LIGHTING_LOADS          | `flicker`                | Sinusoidal intensity fluctuations         |
| THERMAL_APPLIANCES      | `coil_damage`            | Reduced power with increased noise        |
| HVAC_REFRIGERATION      | `compressor_degradation` | Lower steady-state power                  |
| LAUNDRY_APPLIANCES      | `drum_imbalance`         | Increased vibration noise                 |

These faults distort the electrical signature while keeping the appliance within its behavioral class.

---

# Running the Simulator

## Prerequisite

Ensure an MQTT broker (e.g., **Mosquitto**) is running on:

```
localhost:1884
```

---

# Single Appliance Simulation

To simulate a single appliance:

```bash
python mqtt_publisher.py "Fan"
```

Supported appliances:

* Fan
* Laptop
* Incandescent Light Bulb
* Heater
* Microwave
* Hairdryer
* Fridge
* Air Conditioner
* Washing Machine
* Compact Fluorescent Lamp

---

# Running With Fault Injection

Fault modes can be provided as an optional argument.

## Syntax

```bash
python mqtt_publisher.py "ApplianceName" "FaultMode"
```

## Examples

Normal fan behavior

```bash
python mqtt_publisher.py "Fan"
```

Fan with bearing wear

```bash
python mqtt_publisher.py "Fan" "bearing_wear"
```

Lighting flicker

```bash
python mqtt_publisher.py "Incandescent Light Bulb" "flicker"
```

Heating coil degradation

```bash
python mqtt_publisher.py "Heater" "coil_damage"
```

---

# Concurrent Pipeline Test

To test pipeline throughput with multiple simulated devices:

```bash
python test_multi_sockets.py
```

This launches **5 independent smart plug simulators simultaneously**, allowing validation of:

* MQTT throughput
* ML service concurrency
* pipeline stability

---

# Telemetry Payload Format

The simulator publishes data to:

```
smartplug/{plug_id}/telemetry
```

Example payload:

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

---

# Future Scope

Currently, faults are specified **at simulator startup via CLI arguments**.

Future extensions may include **real-time anomaly injection**, allowing faults to be triggered dynamically through:

* MQTT control messages
* dashboard interactions
* scheduled fault events

This would enable live demonstrations of appliance degradation within the IoT monitoring pipeline.

---

# Summary

This module provides a **controlled, statistically grounded simulation environment** for:

* generating realistic smart plug telemetry
* validating the ML classification pipeline
* testing anomaly detection algorithms
* demonstrating fault scenarios in IoT systems

It serves as the **foundation of the digital twin layer** in our smart plug analytics architecture.

