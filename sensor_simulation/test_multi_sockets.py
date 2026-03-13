import time
import json
import datetime
import os
import paho.mqtt.client as mqtt
from .signal_generator import SmartPlugSimulator

# --- CONFIG ---
BROKER = os.getenv("MQTT_BROKER", "localhost")
PORT = int(os.getenv("MQTT_PORT", 1884))
PUBLISH_TOPIC_TEMPLATE = "smartplug/{}/telemetry"
TICK_RATE_HZ = 10
TICK_INTERVAL = 1.0 / TICK_RATE_HZ

def main():
    print("[TEST] Initializing concurrent device simulators...")
    
    # Instantiate one device for each behavior archetype
    devices = [
        SmartPlugSimulator("Fan", plug_id="plug_01_motor", 
                        #    fault_mode="bearing_wear",
                           ),
        SmartPlugSimulator("Incandescent Light Bulb", plug_id="plug_02_light",
                           fault_mode="flicker",
                           ),
        SmartPlugSimulator("Heater", plug_id="plug_03_thermal",
                        #    fault_mode="coil_damage",
                           ),
        SmartPlugSimulator("Fridge", plug_id="plug_04_hvac",
                           fault_mode="compressor_degradation",
                           ),
        SmartPlugSimulator("Washing Machine", plug_id="plug_05_laundry",
                           fault_mode="drum_imbalance",
                           ),
    ]

    # Connect to MQTT
    client = mqtt.Client()
    try:
        client.connect(BROKER, PORT, 60)
        client.loop_start()
        print(f"[TEST] Connected to MQTT broker at {BROKER}:{PORT}")
    except Exception as e:
        print(f"[TEST] Failed to connect to broker: {e}")
        return

    # Turn all devices on
    for dev in devices:
        dev.turn_on()
        print(f"[TEST] Turned ON: {dev.appliance_name} ({dev.plug_id})")

    print(f"\n[TEST] Streaming telemetry at {TICK_RATE_HZ}Hz. Press Ctrl+C to stop.\n")
    print("-" * 65)
    print(f"{'TIMESTAMP':<25} | {'PLUG ID':<15} | {'APPLIANCE':<12} | {'POWER (W)'}")
    print("-" * 65)

    try:
        while True:
            loop_start = time.time()
            now_iso = datetime.datetime.now(datetime.timezone.utc).isoformat()

            for dev in devices:
                # Get raw sample from behavior models
                telemetry = dev.sample()
                
                topic = PUBLISH_TOPIC_TEMPLATE.format(dev.plug_id)
                client.publish(topic, json.dumps(telemetry))
                
                # Print a throttled console output so it doesn't flood your screen
                # (Only print every ~1 second per device to keep the console readable)
                if int(loop_start * 10) % 10 == 0:
                    print(f"{now_iso[11:23]:<25} | {dev.plug_id:<15} | {dev.appliance_name[:12]:<12} | {telemetry['electrical']['power_active']:>7.2f} W")

            # Enforce strict 10Hz tick rate
            elapsed = time.time() - loop_start
            sleep_time = TICK_INTERVAL - elapsed
            if sleep_time > 0:
                time.sleep(sleep_time)

    except KeyboardInterrupt:
        print("\n[TEST] Shutting down...")
        for dev in devices:
            dev.turn_off()
            # Publish final OFF state before exiting
            client.publish(PUBLISH_TOPIC_TEMPLATE.format(dev.plug_id), json.dumps(dev.sample()))

    finally:
        client.loop_stop()
        client.disconnect()
        print("[TEST] Disconnected.")

if __name__ == "__main__":
    main()