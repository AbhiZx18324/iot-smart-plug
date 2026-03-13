# ML Service: Real-Time Appliance Classification & Anomaly Detection

This directory contains the machine learning pipeline and real-time inference service for our smart plug ecosystem.

Instead of relying on complex, heavy deep learning models, our approach focuses on **system integration and feature engineering**. We take 10Hz active power telemetry, extract statistical features over a rolling window, classify the load into 5 macro behavior classes using a Random Forest Classifier, and compute real-time anomaly scores to detect appliance degradation.

## Directory Structure & File Overview

- **`ml_service.py`**: The core MQTT subscriber and inference engine. It listens to live smart plug telemetry, manages feature buffers, calculates anomaly scores, and publishes predictions back to the broker.
- **`window_processor.py`**: The feature extraction engine. It maintains a rolling buffer of power readings and computes 11 statistical/temporal features (mean, std_dev, spike_count, oscillations, etc.).
- **`anomaly_detector.py`**: Calculates anomaly scores (mean absolute z-score) for real-time feature vectors against known healthy baselines.
- **`test_window.py`**: A quick script to validate the sliding window logic and feature shapes.
- **`baselines/`**:
    - `baselines.json`: The extracted statistical baselines (mean and std_dev) for each healthy appliance archetype.
    - `compute_baselines.py`: Script to profile the simulator's healthy archetypes and generate the `baselines.json` file.


- **`models/`**:
    - `behaviour_classifier.pkl`: The trained Random Forest model.
    - `model_config.json`: The mapping of integer IDs to string labels and vice versa. (e.g., `1 -> HVAC_REFRIGERATION`).


- **`training/`**:
    - `plaid_adapter.py`: A crucial utility that downsamples high-frequency waveforms into smart-plug-compatible signals.
    - `training.ipynb`: The main notebook where data is parsed, features are engineered, and the model is trained.
    - `plaid_stats.ipynb`: Notebook used to extract the physical statistics of appliances (means, std_devs, transient spikes) to help build our upstream simulator.



## Core Architecture & Engineering Decisions

### 1. Domain Adaptation: The `plaid_adapter.py`

*The Problem:* The PLAID dataset was recorded at **30,000 Hz** (capturing high-frequency current/voltage waveforms). However, cheap ESP32-based smart plugs only output active power readings at roughly **10 Hz**.

*The Solution:* We built a software adapter that mathematically simulates a smart plug's metering IC. It calculates instantaneous power, extracts the cycle RMS envelope, applies a smoothing convolution, and downsamples the data to 10 Hz. This completely eliminates the domain mismatch between our training data and our deployment environment.

### 2. The Sliding Window Processor

Because Random Forests cannot natively understand time-series sequences (unlike LSTMs), we give the model "memory" by extracting scalar features from a rolling window of the last 20 samples (2 seconds of data). Key features engineered:

- `std_power` & `oscillations`: Captures mechanical vibrations (e.g., washing machine drums, fans).
- `max_delta` & `spike_count`: Captures startup transients and compressor inrush currents.
- `mean_power`: Captures the steady-state baseline.

### 3. The "Belief State" Temporal Smoothing (`ml_service.py`)

Random Forests process every 2-second window in isolation, which can lead to jittery predictions (e.g., guessing "Fan" for a split second while an AC powers down).
To fix this, `ml_service.py` implements a **Probabilistic Belief State**. Instead of taking the raw output, we accumulate the prediction probabilities over a temporal window of 12 steps, applying a decay factor (`DECAY = 0.85`) to old evidence. This creates a highly stable, self-correcting prediction stream.

### 4. Chronic Anomaly Detection (Device-Specific Baselines)

*The Problem:* Detecting subtle mechanical wear (like bearing degradation in a fan) is impossible using global PLAID dataset statistics because of massive macro-class variance. For example, the `SMALL_MOTOR_ELECTRONICS` class lumps 40W laptops with 1200W vacuums, giving a standard deviation of >260W. A subtle 15W fault goes entirely unnoticed.

*The Solution:* We implemented device-specific anomaly baselines. `compute_baselines.py` captures the exact feature-space expectations (mean and std_dev) of our healthy simulated archetypes. The `anomaly_detector.py` computes a Z-score against these tightly constrained baselines, allowing subtle chronic degradations to trigger high Z-scores and successfully flag an anomaly in the MQTT payload.

### 5. Relay-Triggered Amnesia

If a user turns the smart plug OFF via the relay, the electrical signature drops to 0W. If another appliance is plugged in and turned on, the sliding window would mix the old appliance's data with the new one.
We explicitly check for the `relay: "OFF"` state in the MQTT payload. When detected, the service hard-resets all dictionaries (`processors`, `belief_state`, `belief_count`), ensuring zero history poisoning.

## The 5 Macro Load Classes

Due to the difficulty of discerning identical resistive loads (e.g., a 1200W hairdryer vs a 1200W space heater), we mapped the 11 PLAID appliances into 5 reliable behavior classes:

1. **SMALL_MOTOR_ELECTRONICS** (Fans, Laptops)
2. **LIGHTING_LOADS** (Incandescent, CFL bulbs)
3. **THERMAL_APPLIANCES** (Heaters, Microwaves, Hairdryers)
4. **HVAC_REFRIGERATION** (Fridges, ACs)
5. **LAUNDRY_APPLIANCES** (Washing Machines)

## Dataset Setup (Reproducing Training)

The raw PLAID dataset is heavily git-ignored due to its massive size. If you wish to rerun the feature extraction or retrain the Random Forest model using `training.ipynb` or `plaid_stats.ipynb`, you must manually download and place the data in the correct directory.

1. **Download the Data:** Download the 2014 dataset from here: [PLAID dataset](https://figshare.com/articles/dataset/PLAID_2014/11605074?file=21003648).
2. **Extract:** Extract the contents into the `ml/training/data/` directory.

Your file structure must look exactly like this for the pandas dataframes to load correctly:

```text
ml/training/
├── data/
│   ├── meta_2014.json        <-- Required for metadata mapping
│   └── 2014/
│       └── 2014/
│           ├── 1.csv         <-- High frequency waveform data
│           ├── 2.csv
│           └── ...
├── plaid_adapter.py
└── training.ipynb

```

Once the data is in place, you can execute all cells in `training.ipynb` to rebuild the feature matrix, retrain the model, and export a fresh `behaviour_classifier.pkl` to the `models/` directory.

To regenerate the anomaly baselines after modifying the simulator, run:

```bash
python -m ml.baselines.compute_baselines

```

## How to Run

1. Start your local MQTT broker (e.g., Mosquitto on port 1884).
2. Start the ML Inference service:

```bash
python -m ml.ml_service

```

3. The service will automatically subscribe to `smartplug/+/telemetry`, process incoming streams in real-time, evaluate anomalies, and publish the enriched predictions to `smartplug/{plug_id}/inference`.