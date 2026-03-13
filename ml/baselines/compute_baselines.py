import json
import numpy as np
import time
from ml.window_processor import SlidingWindowProcessor
from sensor_simulation.signal_generator import SmartPlugSimulator

CLASS_REPRESENTATIVES = {
    "SMALL_MOTOR_ELECTRONICS": "Fan",
    "LIGHTING_LOADS": "Incandescent Light Bulb",
    "THERMAL_APPLIANCES": "Heater",
    "HVAC_REFRIGERATION": "Fridge",
    "LAUNDRY_APPLIANCES": "Washing Machine"
}

def generate_all_baselines(num_windows=100, output_file="ml/baselines/baselines.json"):
    all_baselines = {}
    processor = SlidingWindowProcessor() # Used for its FEATURE_KEYS mapping

    for macro_class, appliance_name in CLASS_REPRESENTATIVES.items():
        simulator = SmartPlugSimulator(appliance_name)
        simulator.turn_on()
        
        healthy_features = []
        while len(healthy_features) < num_windows:
            sample = simulator.sample()
            f_dict = processor.add_sample(sample["timestamp"], sample["electrical"]["power_active"])
            if f_dict:
                healthy_features.append(processor.get_feature_vector(f_dict))

        matrix = np.array(healthy_features)
        all_baselines[macro_class] = {
            "mean": np.mean(matrix, axis=0).tolist(),
            "std": (np.std(matrix, axis=0) + 1e-5).tolist()
        }
    
    with open(output_file, "w") as f:
        json.dump(all_baselines, f, indent=4)

if __name__ == "__main__":
    generate_all_baselines()