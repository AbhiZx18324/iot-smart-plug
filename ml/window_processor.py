import numpy as np
from collections import deque

class SlidingWindowProcessor:
    FEATURE_KEYS = [
        "mean_power", "max_power", "min_power", "std_power", 
        "range_power", "coef_var", "max_delta", "mean_delta", 
        "spike_count", "slope", "oscillations"
    ]

    def __init__(self, window_size=20, step_size=5):
        self.window_size = window_size
        self.step_size = step_size
        self.buffer = deque()

    def add_sample(self, timestamp, power):
        self.buffer.append((timestamp, power))
        if len(self.buffer) < self.window_size:
            return None

        features_dict = self._compute_features()
        
        # Prepare the sliding window for next batch
        for _ in range(self.step_size):
            if self.buffer: self.buffer.popleft()

        return features_dict

    def get_feature_vector(self, features_dict):
        """Helper to ensure the list/vector matches the expected ML input order."""
        return [features_dict[k] for k in self.FEATURE_KEYS]

    def _compute_features(self):
        powers = np.array([p for _, p in self.buffer])
        mean_p = np.mean(powers)
        std_p = np.std(powers)
        deltas = np.diff(powers)

        return {
            "mean_power": mean_p,
            "max_power": np.max(powers),
            "min_power": np.min(powers),
            "std_power": std_p,
            "range_power": np.max(powers) - np.min(powers),
            "coef_var": std_p / mean_p if mean_p > 0 else 0,
            "max_delta": np.max(np.abs(deltas)) if len(deltas) > 0 else 0,
            "mean_delta": np.mean(np.abs(deltas)) if len(deltas) > 0 else 0,
            "spike_count": np.sum(np.abs(deltas) > 0.15 * mean_p),
            "slope": np.polyfit(np.arange(len(powers)), powers, 1)[0] if len(powers) > 1 else 0,
            "oscillations": np.sum(np.diff(np.sign(deltas)) != 0) if len(deltas) > 1 else 0
        }
