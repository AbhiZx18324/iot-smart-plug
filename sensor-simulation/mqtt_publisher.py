# mqtt_publisher.py

import json
import time
from datetime import datetime, timezone

import paho.mqtt.client as mqtt

from signal_generator import SmartPlugSimulator
from usage_scheduler import UsageScheduler

BROKER_ADDRESS = "127.0.0.1"
BROKER_PORT = 1884
PUBLISH_INTERVAL = 1  # seconds


class SmartPlugMQTTPublisher:
    def __init__(self, plug_id, appliance_name):
        self.plug_id = plug_id
        self.topic = f"smartplug/{plug_id}/telemetry"

        self.simulator = SmartPlugSimulator(
            appliance_name=appliance_name,
            plug_id=plug_id
        )
        self.scheduler = UsageScheduler(appliance_name)

        self.client = mqtt.Client(client_id=plug_id)

    def connect(self):
        self.client.connect(BROKER_ADDRESS, BROKER_PORT)
        self.client.loop_start()

    def publish_once(self):
        sample = self.simulator.sample()

        message = {
            "plug_id": sample["plug_id"],
            "timestamp": datetime.now(timezone.utc).isoformat(),

            "electrical": {
                "voltage_rms": sample["voltage_rms"],
                "current_rms": sample["current_rms"],
                "power_active": sample["power_active"],
                "frequency": sample["frequency"]
            },

            "state": {
                "relay": sample["relay"],
                "appliance_truth": sample["appliance_truth"]
            }
        }

        payload = json.dumps(message)
        self.client.publish(self.topic, payload)
        print(f"[PUBLISHED] {payload}")
        
    def start(self):
        print(f"[INFO] Starting smart plug: {self.plug_id}")
        self.simulator.turn_on()

        try:
            while True:
                self.scheduler.update(self.simulator)

                self.publish_once()
                time.sleep(PUBLISH_INTERVAL)

        except KeyboardInterrupt:
            print("\n[INFO] Shutting down smart plug...")
            self.simulator.turn_off()

            # Publish explicit OFF state
            self.publish_once()
            time.sleep(0.2)
            
            self.client.loop_stop()
            self.client.disconnect()

if __name__ == "__main__":
    publisher = SmartPlugMQTTPublisher(
        plug_id="plug_001_sim",
        appliance_name="fan"
    )

    publisher.connect()
    publisher.start()