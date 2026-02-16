## MQTT Topic

```
smartplug/{plug_id}/inference
```

Published by: ML service
Consumed by: Backend + dashboard

---

## Message Format

```json
{
  "plug_id": "plug_001",
  "timestamp": "ISO-8601 UTC",
  "predicted_appliance": "fan",
  "confidence": 0.87,
  "model_version": "v1.0"
}
```

---

## Field Meaning

| Field               | Meaning                              |
| ------------------- | ------------------------------------ |
| plug_id             | device identity                      |
| timestamp           | timestamp of last sample in window   |
| predicted_appliance | most likely appliance class          |
| confidence          | probability estimate from classifier |
| model_version       | classifier used for traceability     |

---

## Behavioral Guarantees

The ML service guarantees:

* One prediction per sliding window
* Predictions independent of database state
* No inference when device OFF
* Confidence ∈ [0,1]
* Stateless across restarts (relearns from stream)

---

## Backend Responsibilities (informational)

Backend may:

* log predictions
* aggregate sessions
* correlate with telemetry

Backend must NOT:

* reinterpret confidence
* smooth predictions
* infer device OFF from silence