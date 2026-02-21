## MQTT Topic


```

smartplug/{plug_id}/inference

```

Published by: ML service<br>
Consumed by: Backend + dashboard

---

## Message Format

```json
{
  "plug_id": "plug_001",
  "timestamp": "ISO-8601 UTC", 
  "load_class": "THERMAL_APPLIANCES",
  "confidence": 0.97,
  "stability": 1.0,
  "model_version": "v2.0-behavior"
}

```

---

## Field Meaning

| Field | Meaning |
| --- | --- |
| plug_id | device identity |
| timestamp | timestamp of the last sample in the sliding window |
| load_class | the predicted appliance macro-class (or "OFF") |
| confidence | instantaneous probability estimate from the classifier (0.0 to 1.0) |
| stability | belief maturity based on rolling temporal window (0.0 to 1.0) |
| model_version | classifier version used for traceability |

---

## Behavioral Guarantees

The ML service guarantees:

* One prediction per sliding window (once the buffer fills)
* Predictions are independent of the backend database state
* **Explicit OFF signaling:** When the device relay is switched off, the service publishes exactly one payload with `load_class: "OFF"`, `confidence: 1.0`, and `stability: 1.0` to signal the end of a session.
* Confidence and Stability ∈ [0,1]
* Stateless across restarts (it completely relearns from the live stream)

---

## Backend Responsibilities (informational)

Backend may:

* log predictions
* aggregate usage sessions based on class shifts or "OFF" messages
* correlate inferences with raw electrical telemetry

Backend must NOT:

* reinterpret or recalculate confidence
* smooth predictions (temporal smoothing is already handled natively by the ML service's belief state)
* infer device OFF from silence (wait for the explicit `load_class: "OFF"` message)