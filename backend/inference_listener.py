import json
import paho.mqtt.client as mqtt

BROKER = "localhost"
PORT = 1884
TOPIC = "smartplug/+/inference"

def on_connect(client, userdata, flags, rc):
    print("[Observer] Connected")
    client.subscribe(TOPIC)

def on_message(client, userdata, msg):
    data = json.loads(msg.payload.decode())

    print(
        f"[Inference] {data['plug_id']} → "
        f"{data['load_class']} "
        f"(conf {data['confidence']:.2f})"
    )

client = mqtt.Client()
client.on_connect = on_connect
client.on_message = on_message

client.connect(BROKER, PORT, 60)
client.loop_forever()
