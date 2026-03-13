import json
import numpy as np
import time
from ml.window_processor import SlidingWindowProcessor
from sensor_simulation.signal_generator import SmartPlugSimulator

# Map the 5 ML macro-classes to a representative appliance from your simulator
CLASS_REPRESENTATIVES = {
    "SMALL_MOTOR_ELECTRONICS": "Fan",
    "LIGHTING_LOADS": "Incandescent Light Bulb",
    "THERMAL_APPLIANCES": "Heater",
    "HVAC_REFRIGERATION": "Fridge",
    "LAUNDRY_APPLIANCES": "Washing Machine"
}

def generate_all_baselines(num_windows=100, output_file="ml/baselines/baselines.json"):
    print(f"Generating healthy baselines for {len(CLASS_REPRESENTATIVES)} classes...\n")
    
    all_baselines = {}

    for macro_class, appliance_name in CLASS_REPRESENTATIVES.items():
        print(f"Profiling [{macro_class}] using '{appliance_name}'...")
        
        simulator = SmartPlugSimulator(appliance_name)
        simulator.turn_on()
        
        processor = SlidingWindowProcessor(window_size=20, step_size=5)
        healthy_features = []
        
        # We need a simulated timestamp that increments by 0.1s (10Hz)
        sim_time = time.time()
        
        # Keep sampling until we have the desired number of complete feature windows
        while len(healthy_features) < num_windows:
            sample = simulator.sample()
            
            features = processor.add_sample(sim_time, sample["power_active"])
            if features:
                # Ensure the order of features matches exactly what your ML model expects
                feature_list = [
                    features["mean_power"], features["max_power"], features["min_power"], 
                    features["std_power"], features["range_power"], features["coef_var"], 
                    features["max_delta"], features["mean_delta"], features["spike_count"], 
                    features["slope"], features["oscillations"]
                ]
                healthy_features.append(feature_list)
                
            sim_time += 0.1 # 10 Hz tick

        feature_matrix = np.array(healthy_features)
        
        # Calculate mean and standard deviation across the 100 windows
        mean_vec = np.mean(feature_matrix, axis=0)
        # Add 1e-5 epsilon to prevent Divide-By-Zero in the anomaly z-score calculation
        std_vec = np.std(feature_matrix, axis=0) + 1e-5 
        
        all_baselines[macro_class] = {
            "mean": mean_vec.tolist(),
            "std": std_vec.tolist()
        }
        
        print(f"  -> Captured {len(healthy_features)} windows. Mean power: {mean_vec[0]:.2f} W\n")

    # Save everything to the unified JSON file
    with open(output_file, "w") as f:
        json.dump(all_baselines, f, indent=4)
        
    print(f"Successfully saved all baselines to '{output_file}'.")

if __name__ == "__main__":
    generate_all_baselines()