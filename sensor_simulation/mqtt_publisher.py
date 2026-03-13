import json
import time
import sys
import os
import paho.mqtt.client as mqtt

from .signal_generator import SmartPlugSimulator
from .usage_scheduler import UsageScheduler

BROKER_ADDRESS = os.getenv("MQTT_BROKER", "localhost")
BROKER_PORT = int(os.getenv("MQTT_PORT", 1884))
PUBLISH_INTERVAL = 0.1 

class SmartPlugMQTTPublisher:
    def __init__(self, plug_id, appliance_name, fault_mode=None):
        self.plug_id = plug_id
        self.topic = f"smartplug/{plug_id}/telemetry"

        self.simulator = SmartPlugSimulator(
            appliance_name=appliance_name,
            plug_id=plug_id,
            fault_mode=fault_mode
        )
        self.scheduler = UsageScheduler(appliance_name)
        self.client = mqtt.Client(client_id=plug_id)

    def connect(self):
        self.client.connect(BROKER_ADDRESS, BROKER_PORT)
        self.client.loop_start()

    def publish_once(self):
        payload_dict = self.simulator.sample()
        payload = json.dumps(payload_dict)
        self.client.publish(self.topic, payload)
        
        # Refined log output
        fault_str = f" [FAULT: {self.simulator.device.fault_mode}]" if self.simulator.device.fault_mode else ""
        print(f"[PUBLISHED] {payload_dict['plug_id']} | {payload_dict['electrical']['power_active']}W{fault_str}")
        
    def start(self):
        print(f"[INFO] Starting smart plug: {self.plug_id}")
        self.simulator.turn_on()

        try:
            while True:
                self.scheduler.update(self.simulator)
                self.publish_once()
                time.sleep(PUBLISH_INTERVAL)

        except KeyboardInterrupt:
            print("\n[INFO] Shutting down...")
            self.simulator.turn_off()
            self.publish_once()
            time.sleep(0.2)
            self.client.loop_stop()
            self.client.disconnect()

if __name__ == "__main__":
    # Usage: python mqtt_publisher.py "PlugID" "ApplianceName" "OptionalFaultMode"
    plug_id = sys.argv[1] if len(sys.argv) > 1 else "plug_001_sim"
    appliance = sys.argv[2] if len(sys.argv) > 2 else "Fan"
    fault = sys.argv[3] if len(sys.argv) > 3 else None

    publisher = SmartPlugMQTTPublisher(
        plug_id=plug_id,
        appliance_name=appliance,
        fault_mode=fault
    )

    publisher.connect()
    publisher.start()