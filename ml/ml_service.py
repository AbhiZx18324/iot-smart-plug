import json
from collections import defaultdict

import joblib
import paho.mqtt.client as mqtt

from .window_processor import SlidingWindowProcessor
from .anomaly_detector import AnomalyDetector

# ---------------- CONFIG ---------------- #

BROKER = "localhost"
PORT = 1884

TELEMETRY_TOPIC = "smartplug/+/telemetry"
INFERENCE_TOPIC_TEMPLATE = "smartplug/{}/inference"

MODEL_PATH = "ml/models/behaviour_classifier.pkl"
MODEL_VERSION = "v2.0-behavior"
CONFIG_PATH = "ml/models/model_config.json"
ANOMALY_CONFIG_PATH = "ml/baselines/baselines.json"

WINDOW_SIZE = 20
STEP_SIZE = 5

# temporal belief window
BELIEF_WINDOW = 12
DECAY = 0.85

# ---------------------------------------- #

print("[ML] Loading model...")
model = joblib.load(MODEL_PATH)
print("[ML] Model loaded")

print("[ML] Loading config file...")
with open(CONFIG_PATH, 'r') as f:
    js = json.load(f)
LABEL2ID = js['label2id']
ID2LABEL = js['id2label']
print("[ML] Config file loaded")

print("[ML] Loading anomaly detector...")
detector = AnomalyDetector(ANOMALY_CONFIG_PATH)
print("[ML] Anomaly detector loaded")


# per-device sliding feature windows
processors = defaultdict(lambda: SlidingWindowProcessor(WINDOW_SIZE, STEP_SIZE))

# probabilistic belief state
belief_state = defaultdict(lambda: defaultdict(float))
belief_count = defaultdict(int)


# ---------- LOAD CLASS INFERENCE ---------- #

def compute_load_class(plug_id, feature_vector):
    """
    Convert model probabilities → physical load class belief
    and accumulate evidence over time.
    """

    probs = model.predict_proba(feature_vector)[0]
    classes = model.classes_

    # instantaneous evidence
    instant_scores = defaultdict(float)

    for cid, prob in zip(classes, probs):
        label = ID2LABEL[str(int(cid))]
        load_class = label
        instant_scores[load_class] += prob

    # accumulate belief
    for lc, score in instant_scores.items():
        belief_state[plug_id][lc] += score

    belief_count[plug_id] += 1

    # decay old evidence (sliding memory)
    if belief_count[plug_id] > BELIEF_WINDOW:
        for lc in belief_state[plug_id]:
            belief_state[plug_id][lc] *= DECAY

    # normalize belief
    total = sum(belief_state[plug_id].values())
    best = max(belief_state[plug_id], key=belief_state[plug_id].get)

    confidence = belief_state[plug_id][best] / total
    stability = min(belief_count[plug_id] / BELIEF_WINDOW, 1.0)

    return best, confidence, stability


# ---------- MQTT CALLBACKS ---------- #

def on_connect(client, userdata, flags, rc):
    print("[ML] Connected to broker")
    client.subscribe(TELEMETRY_TOPIC)


def publish_prediction(client, plug_id, timestamp, load_class, confidence, stability, is_anomaly=False, anomaly_score=0.0):
    topic = INFERENCE_TOPIC_TEMPLATE.format(plug_id)

    message = {
        "plug_id": plug_id,
        "timestamp": timestamp,
        "load_class": load_class,
        "confidence": float(confidence),
        "stability": float(stability),
        "is_anomaly": bool(is_anomaly),
        "anomaly_score": float(anomaly_score),
        "model_version": MODEL_VERSION
    }

    client.publish(topic, json.dumps(message))
    
    # Print a cleaner, unified log to the console
    anom_str = f" | ANOMALY! (Score: {anomaly_score:.2f})" if is_anomaly else ""
    print(f"[ML] {plug_id} → {load_class} (conf={confidence:.2f}, stab={stability:.2f}){anom_str}")

def reset_device_context(plug_id):
    """Clean up tracking when a device is turned off."""
    processors.pop(plug_id, None)
    belief_state.pop(plug_id, None)
    belief_count.pop(plug_id, None)

def on_message(client, userdata, msg):
    try:
        payload = json.loads(msg.payload.decode())
        plug_id = payload["plug_id"]
        power = payload["electrical"]["power_active"]
        relay_state = payload.get("state", {}).get("relay", "ON")

        if relay_state == "OFF" or power < 2:
            reset_device_context(plug_id)
            if relay_state == "OFF":
                publish_prediction(client, plug_id, payload["timestamp"], "OFF", 1.0, 1.0)
            return

        processor = processors[plug_id]
        features_dict = processor.add_sample(payload["timestamp"], power)

        if features_dict:
            # Consistent vectorization
            vector = processor.get_feature_vector(features_dict)
            
            load_class, conf, stab = compute_load_class(plug_id, [vector])

            is_anom, score = False, 0.0
            if conf > 0.5 and stab > 0.8:
                is_anom, score = detector.is_anomaly(vector, load_class)

            publish_prediction(client, plug_id, payload["timestamp"], load_class, conf, stab, is_anom, score)

    except Exception as e:
        print(f"[ML ERROR] {e}")


# ---------- START SERVICE ---------- #

if __name__ == "__main__":
    client = mqtt.Client()
    client.on_connect = on_connect
    client.on_message = on_message

    client.connect(BROKER, PORT, 60)
    client.loop_forever()
