import numpy as np
import joblib
import json
import warnings
from window_processor import SlidingWindowProcessor

warnings.filterwarnings('ignore')

# 1. Load the existing model and config
MODEL_PATH = "ml/models/behaviour_classifier.pkl"
CONFIG_PATH = "ml/models/model_config.json"

model = joblib.load(MODEL_PATH)
with open(CONFIG_PATH, 'r') as f:
    js = json.load(f)
ID2LABEL = js['id2label']

print("Sweeping Power from 0W to 4000W to map ML Decision Boundaries...")
print("-" * 60)

current_class = None

# Sweep from 1W to 4000W in 2W increments
for power_level in range(1, 4000, 2):
    # Initialize a fresh processor for each power level
    processor = SlidingWindowProcessor(window_size=20, step_size=5)
    
    features = None
    # Feed 20 samples to fill the window and simulate a steady state
    # We add a tiny bit of noise (0.1W) so std_dev isn't exactly zero
    for t in range(20):
        noisy_power = power_level + np.random.normal(0, 0.1)
        features = processor.add_sample(t, noisy_power)
        
    if features is not None:
        feature_vector = [list(features.values())]
        
        # Predict the class
        pred_idx = model.predict(feature_vector)[0]
        predicted_label = ID2LABEL[str(int(pred_idx))]
        
        if current_class is None:
            current_class = predicted_label
            print(f"[{power_level:4}W] Started in zone : {current_class}")
        elif predicted_label != current_class:
            print(f"[{power_level:4}W] Boundary Crossed: {current_class} -> {predicted_label}")
            current_class = predicted_label

print("-" * 60)
print("Sweep Complete.")