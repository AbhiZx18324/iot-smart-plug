import json
from collections import defaultdict

import joblib
import paho.mqtt.client as mqtt

from window_processor import SlidingWindowProcessor
from collections import deque, defaultdict

prediction_history = defaultdict(lambda: deque(maxlen=5))

BROKER = "localhost"
PORT = 1884

TELEMETRY_TOPIC = "smartplug/+/telemetry"
INFERENCE_TOPIC_TEMPLATE = "smartplug/{}/inference"

MODEL_PATH = "ml/models/appliance_classifier.pkl"
MODEL_VERSION = "v1.0"
CONFIG_PATH = "ml/models/model_config.json"

model = joblib.load(MODEL_PATH)
print("[ML] Model loaded")

with open(CONFIG_PATH, 'r') as f:
    config = json.load(f)
id2label = {int(k): v for k, v in config["id2label"].items()}

processors = defaultdict(lambda: SlidingWindowProcessor(window_size=20, step_size=5))

def on_connect(client, userdata, flags, rc):
    print("[ML] Connected to broker")
    client.subscribe(TELEMETRY_TOPIC)

def on_message(client, userdata, msg):
    try:
        payload = json.loads(msg.payload.decode())

        plug_id = payload["plug_id"]
        timestamp = payload["timestamp"]
        power = payload["electrical"]["power_active"]

        if power < 2:   # threshold watts for silence
            return

        processor = processors[plug_id]
        features = processor.add_sample(timestamp, power)

        if features is None:
            return

        feature_vector = [list(features.values())]
        prediction = model.predict(feature_vector)[0]
        confidence = max(model.predict_proba(feature_vector)[0])

        hist = prediction_history[plug_id]
        hist.append(prediction)

        stable_prediction = max(set(hist), key=hist.count)
        stability = hist.count(stable_prediction) / len(hist)

        publish_prediction(client, plug_id, timestamp, stable_prediction, stability)

    except Exception as e:
        print("[ML ERROR]", e)

def publish_prediction(client, plug_id, timestamp, prediction, confidence):

    topic = INFERENCE_TOPIC_TEMPLATE.format(plug_id)

    message = {
        "plug_id": plug_id,
        "timestamp": timestamp,
        "predicted_appliance": id2label[int(prediction)],
        "confidence": float(confidence),
        "model_version": MODEL_VERSION
    }

    client.publish(topic, json.dumps(message))
    print(f"[ML] {plug_id} → {id2label[prediction]} ({confidence:.2f})")

if __name__ == "__main__":
    client = mqtt.Client()
    client.on_connect = on_connect
    client.on_message = on_message

    client.connect(BROKER, PORT, 60)
    client.loop_forever()
