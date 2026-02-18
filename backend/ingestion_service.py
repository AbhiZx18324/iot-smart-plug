# ingestion_service.py

import os
import json
import logging
import paho.mqtt.client as mqtt
from dotenv import load_dotenv
from influxdb_client import InfluxDBClient, Point
from influxdb_client.client.write_api import SYNCHRONOUS
from datetime import datetime

# --- 1. Load Secrets ---
load_dotenv()  # Loads variables from the .env file

INFLUX_TOKEN = os.getenv("INFLUX_TOKEN")
if not INFLUX_TOKEN:
    raise ValueError("CRITICAL: INFLUX_TOKEN not found. Please set it in the .env file.")

# --- 2. Logging Setup ---
# This configures logs to output to the console AND save to 'ingestion.log'
logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s [%(levelname)s] %(message)s",
    handlers=[
        logging.FileHandler("./backend/ingestion.log"),  # Saves to file
        logging.StreamHandler()                # Prints to terminal
    ]
)
logger = logging.getLogger(__name__)

# --- Configuration ---
BROKER_ADDRESS = "127.0.0.1"
BROKER_PORT = 1883
TOPIC = "smartplug/+/telemetry"
INFLUX_URL = "http://localhost:8086"
INFLUX_ORG = "smartplug_org"
INFLUX_BUCKET = "smartplug_data"

# Initialize InfluxDB Client
influx_client = InfluxDBClient(url=INFLUX_URL, token=INFLUX_TOKEN, org=INFLUX_ORG)
write_api = influx_client.write_api(write_options=SYNCHRONOUS)

def validate_payload(data):
    """Enforces strict physical bounds and schema requirements."""
    try:
        plug_id = data["plug_id"]
        electrical = data["electrical"]
        state = data["state"]
        
        voltage = electrical["voltage_rms"]
        frequency = electrical["frequency"]
        power = electrical["power_active"]
        relay = state["relay"]

        if not (180.0 <= voltage <= 260.0):
            logger.warning(f"Invalid voltage ({voltage}V) from {plug_id}. Dropping.")
            return False
        if not (49.0 <= frequency <= 51.0):
            logger.warning(f"Invalid frequency ({frequency}Hz) from {plug_id}. Dropping.")
            return False
        if power < 0.0:
            logger.warning(f"Negative power ({power}W) from {plug_id}. Dropping.")
            return False
        if relay not in ["ON", "OFF"]:
            logger.warning(f"Invalid relay state ({relay}) from {plug_id}. Dropping.")
            return False

        return True

    except KeyError as e:
        logger.warning(f"Missing required field {e} in payload. Dropping.")
        return False
    except TypeError:
        logger.warning("Invalid data types in payload. Dropping.")
        return False

def insert_data(data):
    """Parses JSON and writes to InfluxDB."""
    try:
        plug_id = data["plug_id"]
        ts_str = data["timestamp"].replace("Z", "+00:00")
        dt = datetime.fromisoformat(ts_str)

        p_telemetry = Point("telemetry") \
            .tag("plug_id", plug_id) \
            .field("voltage_rms", float(data["electrical"]["voltage_rms"])) \
            .field("current_rms", float(data["electrical"]["current_rms"])) \
            .field("power_active", float(data["electrical"]["power_active"])) \
            .field("frequency", float(data["electrical"]["frequency"])) \
            .time(dt)

        p_state = Point("state_metadata") \
            .tag("plug_id", plug_id) \
            .field("relay", data["state"]["relay"]) \
            .time(dt)

        if "appliance_truth" in data["state"]:
            p_state.field("appliance_truth", data["state"]["appliance_truth"])

        write_api.write(bucket=INFLUX_BUCKET, org=INFLUX_ORG, record=[p_telemetry, p_state])

    except Exception as e:
        logger.error(f"Failed to write to InfluxDB: {e}")

def on_connect(client, userdata, flags, rc):
    if rc == 0:
        logger.info(f"Connected to MQTT broker at {BROKER_ADDRESS}:{BROKER_PORT}")
        client.subscribe(TOPIC)
        logger.info(f"Subscribed to topic: {TOPIC}")
    else:
        logger.error(f"MQTT Connection failed with code {rc}")

def on_message(client, userdata, msg):
    try:
        payload = msg.payload.decode("utf-8")
        data = json.loads(payload)

        if validate_payload(data):
            insert_data(data)
            logger.info(f"DATA OK | {data['timestamp']} | {data['plug_id']} | Saved to DB.")

    except json.JSONDecodeError:
        logger.warning("Invalid JSON string received. Dropping.")
    except Exception as e:
        logger.error(f"Unexpected error processing message: {e}")

def main():
    client = mqtt.Client(client_id="backend_ingestion_service")
    client.on_connect = on_connect
    client.on_message = on_message

    logger.info("Starting Backend Ingestion Service for InfluxDB...")
    try:
        client.connect(BROKER_ADDRESS, BROKER_PORT)
        client.loop_forever()
    except KeyboardInterrupt:
        logger.info("Shutting down service...")
    except Exception as e:
        logger.error(f"Broker connection failed: {e}")
    finally:
        influx_client.close()

if __name__ == "__main__":
    main()