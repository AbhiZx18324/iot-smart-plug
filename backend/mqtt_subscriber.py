# mqtt_subscriber.py

import json
import paho.mqtt.client as mqtt

BROKER_ADDRESS = "localhost"
BROKER_PORT = 1883
TOPIC = "smartplug/+/telemetry"


def on_connect(client, userdata, flags, rc):
    if rc == 0:
        print("[INFO] Connected to MQTT broker")
        client.subscribe(TOPIC)
        print(f"[INFO] Subscribed to topic: {TOPIC}")
    else:
        print(f"[ERROR] Connection failed with code {rc}")


def on_message(client, userdata, msg):
    try:
        payload = msg.payload.decode("utf-8")
        data = json.loads(payload)

        plug_id = data["plug_id"]
        ts = data["timestamp"]
        power = data["electrical"]["power_active"]
        relay = data["state"]["relay"]
        appliance = data["state"].get("appliance_truth", "UNKNOWN")

        print(
            f"[DATA] {ts} | {plug_id} | "
            f"{appliance} | {relay} | {power:.2f} W"
        )

    except json.JSONDecodeError:
        print("[ERROR] Invalid JSON received")
    except KeyError as e:
        print(f"[ERROR] Missing field: {e}")
    except Exception as e:
        print(f"[ERROR] Unexpected error: {e}")


def main():
    client = mqtt.Client(client_id="backend_subscriber")

    client.on_connect = on_connect
    client.on_message = on_message

    client.connect(BROKER_ADDRESS, BROKER_PORT)
    client.loop_forever()


if __name__ == "__main__":
    main()
