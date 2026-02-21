import json
from collections import defaultdict

import joblib
import paho.mqtt.client as mqtt

from window_processor import SlidingWindowProcessor

# ---------------- CONFIG ---------------- #

BROKER = "localhost"
PORT = 1884

TELEMETRY_TOPIC = "smartplug/+/telemetry"
INFERENCE_TOPIC_TEMPLATE = "smartplug/{}/inference"

MODEL_PATH = "ml/models/behaviour_classifier.pkl"
MODEL_VERSION = "v2.0-behavior"
CONFIG_PATH = "ml/models/model_config.json"

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

ID2LABEL = js['id2label']
print("[ML] Config file loaded")

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

    # print("[ML] instant_scores: ", instant_scores)
    # print("[ML] belief_count: ", belief_count)
    # print("[ML] belief_state: ", belief_state)

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


def publish_prediction(client, plug_id, timestamp, load_class, confidence, stability):
    topic = INFERENCE_TOPIC_TEMPLATE.format(plug_id)

    message = {
        "plug_id": plug_id,
        "timestamp": timestamp,
        "load_class": load_class,
        "confidence": float(confidence),
        "stability": float(stability),
        "model_version": MODEL_VERSION
    }

    client.publish(topic, json.dumps(message))
    print(f"[ML] {plug_id} → {load_class} (conf={confidence:.2f}, stab={stability:.2f})")


def on_message(client, userdata, msg):
    try:
        payload = json.loads(msg.payload.decode())

        plug_id = payload["plug_id"]
        timestamp = payload["timestamp"]
        power = payload["electrical"]["power_active"]
        relay_state = payload.get("state", {}).get("relay", "ON")

        if relay_state == "OFF":
            if plug_id in processors: del processors[plug_id]
            if plug_id in belief_state: del belief_state[plug_id]
            if plug_id in belief_count: del belief_count[plug_id]
            
            publish_prediction(client, plug_id, timestamp, "OFF", 1.0, 1.0)
            return
        
        # ignore OFF state / near zero power
        if power < 2:
            return

        processor = processors[plug_id]
        features = processor.add_sample(timestamp, power)

        if features is None:
            return

        feature_vector = [list(features.values())]
        print("[ML FEATURES]", feature_vector)
        load_class, confidence, stability = compute_load_class(plug_id, feature_vector)
        print(f"[RAW PRED] load: {load_class}\tconf: {confidence}\tstab: {stability}")

        publish_prediction(client, plug_id, timestamp, load_class, confidence, stability)

    except Exception as e:
        print("[ML ERROR]", e)


# ---------- START SERVICE ---------- #

client = mqtt.Client()
client.on_connect = on_connect
client.on_message = on_message

client.connect(BROKER, PORT, 60)
client.loop_forever()

