## MQTT Topic

```text
smartplug/{plug_id}/inference

```

Published by: ML service




Consumed by: Backend + dashboard

---

## Message Format

```json
{
  "plug_id": "plug_001",
  "timestamp": "2026-02-21T08:45:16.211121+00:00", 
  "load_class": "SMALL_MOTOR_ELECTRONICS",
  "confidence": 0.91,
  "stability": 1.0,
  "is_anomaly": true,
  "anomaly_score": 8.42,
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
| is_anomaly | boolean indicating if the current behavior deviates from the appliance's historical baseline |
| anomaly_score | float representing the mean absolute z-score. A value > 2.5 flags `is_anomaly` as `true` |
| model_version | classifier version used for traceability |

---

## Behavioral Guarantees

The ML service guarantees:

* One prediction per sliding window (once the buffer fills).
* Predictions are independent of the backend database state.
* **Explicit OFF signaling:** When the device relay is switched off, the service publishes exactly one payload with `load_class: "OFF"`, `confidence: 1.0`, `stability: 1.0`, `is_anomaly: false`, and `anomaly_score: 0.0` to signal the end of a session.
* Confidence and Stability ∈ [0,1].
* **Anomaly Guardrails:** Anomaly scores are only computed and flagged if the classifier has established a strong, stable baseline (Confidence > 0.5 and Stability > 0.8). Otherwise, `is_anomaly` defaults to `false`.
* Stateless across restarts (it completely relearns from the live stream).

---

## Backend Responsibilities (informational)

Backend may:

* log predictions and record anomaly scores to a timeseries database (e.g., InfluxDB).
* aggregate usage sessions based on class shifts or "OFF" messages.
* correlate inferences with raw electrical telemetry to build visualization dashboards.

Backend must NOT:

* reinterpret or recalculate confidence or anomaly thresholds.
* smooth predictions (temporal smoothing is already handled natively by the ML service's belief state).
* infer device OFF from silence (wait for the explicit `load_class: "OFF"` message).