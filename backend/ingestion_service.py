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
BROKER_PORT = 1884
TELEMETRY_TOPIC = "smartplug/+/telemetry"
INFERENCE_TOPIC = "smartplug/+/inference"

INFLUX_URL = "http://localhost:8086"
INFLUX_ORG = "smartplug_org"
INFLUX_BUCKET = "smartplug_data"

# Initialize InfluxDB Client
influx_client = InfluxDBClient(url=INFLUX_URL, token=INFLUX_TOKEN, org=INFLUX_ORG)
write_api = influx_client.write_api(write_options=SYNCHRONOUS)

def validate_telemetry(data):
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
    
def validate_inference(data):
    """Enforces schema bounds for ML predictions based on inference_schema.md"""
    try:
        plug_id = data["plug_id"]
        conf = float(data["confidence"])
        stab = float(data["stability"])

        if not (0.0 <= conf <= 1.0):
            logger.warning(f"Invalid confidence ({conf}) from {plug_id}. Dropping.")
            return False
        if not (0.0 <= stab <= 1.0):
            logger.warning(f"Invalid stability ({stab}) from {plug_id}. Dropping.")
            return False
        return True
    except KeyError as e:
        logger.warning(f"Missing inference field {e}. Dropping.")
        return False
    except ValueError:
        logger.warning("Invalid data types in inference payload. Dropping.")
        return False

# --- InfluxDB Ingestion ---
def insert_telemetry_data(data):
    """Parses JSON and writes electrical telemetry to InfluxDB."""
    try:
        plug_id = data["plug_id"]
        dt = datetime.fromisoformat(data["timestamp"].replace("Z", "+00:00"))

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
        logger.error(f"Failed to write telemetry to InfluxDB: {e}")

def insert_inference_data(data):
    """Parses JSON and writes ML predictions to InfluxDB."""
    try:
        plug_id = data["plug_id"]
        dt = datetime.fromisoformat(data["timestamp"].replace("Z", "+00:00"))

        p_inference = Point("inference") \
            .tag("plug_id", plug_id) \
            .tag("model_version", data["model_version"]) \
            .field("load_class", data["load_class"]) \
            .field("confidence", float(data["confidence"])) \
            .field("stability", float(data["stability"])) \
            .field("is_anomaly", bool(data["is_anomaly"])) \
            .field("anomaly_score", float(data["anomaly_score"])) \
            .time(dt)

        write_api.write(bucket=INFLUX_BUCKET, org=INFLUX_ORG, record=p_inference)
    except Exception as e:
        logger.error(f"Failed to write inference to InfluxDB: {e}")


# --- MQTT Callbacks ---
def on_connect(client, userdata, flags, rc):
    if rc == 0:
        logger.info(f"Connected to MQTT broker at {BROKER_ADDRESS}:{BROKER_PORT}")
        # Subscribe to both streams
        client.subscribe(TELEMETRY_TOPIC)
        client.subscribe(INFERENCE_TOPIC)
        logger.info(f"Subscribed to topics: {TELEMETRY_TOPIC} & {INFERENCE_TOPIC}")
    else:
        logger.error(f"MQTT Connection failed with code {rc}")

def on_message(client, userdata, msg):
    try:
        topic = msg.topic
        payload = msg.payload.decode("utf-8")
        data = json.loads(payload)

        # Route traffic based on the topic
        if topic.endswith("/telemetry"):
            if validate_telemetry(data):
                insert_telemetry_data(data)
                # Reduced logging to avoid flooding the terminal at 10Hz
                if float(data["electrical"]["power_active"]) == 0.0:
                    logger.info(f"TELEMETRY | {data['plug_id']} turned OFF.")

        elif topic.endswith("/inference"):
            if validate_inference(data):
                insert_inference_data(data)
                anom_flag = " [ANOMALY DETECTED]" if data["is_anomaly"] else ""
                logger.info(f"INFERENCE | {data['plug_id']} -> {data['load_class']} (conf={data['confidence']:.2f}){anom_flag}")

    except json.JSONDecodeError:
        logger.warning("Invalid JSON string received. Dropping.")
    except Exception as e:
        logger.error(f"Unexpected error routing message: {e}")

def main():
    # Use CallbackAPIVersion.VERSION1 to avoid the paho-mqtt deprecation warning
    client = mqtt.Client(mqtt.CallbackAPIVersion.VERSION1, client_id="backend_ingestion_service")
    client.on_connect = on_connect
    client.on_message = on_message

    logger.info("Starting Backend Ingestion Service for Dual-Stream InfluxDB...")
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