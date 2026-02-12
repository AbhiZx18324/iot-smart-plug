# window_processor.py

from collections import deque
import numpy as np


class SlidingWindowProcessor:
    def __init__(self, window_size=20, step_size=5):
        self.window_size = window_size
        self.step_size = step_size
        self.buffer = deque()

    def add_sample(self, timestamp, power):
        """
        Add a new sample to the buffer.
        Returns a feature dict when a window is ready, else None.
        """
        self.buffer.append((timestamp, power))

        if len(self.buffer) < self.window_size:
            return None

        features = self._compute_features()

        # Slide window
        for _ in range(self.step_size):
            if self.buffer:
                self.buffer.popleft()

        return features

    def _compute_features(self):
        powers = np.array([p for _, p in self.buffer])

        mean_power = np.mean(powers)
        max_power = np.max(powers)
        min_power = np.min(powers)
        std_power = np.std(powers)

        range_power = max_power - min_power
        coef_var = std_power / mean_power if mean_power > 0 else 0

        deltas = np.diff(powers)
        max_delta = np.max(np.abs(deltas)) if len(deltas) > 0 else 0
        mean_delta = np.mean(np.abs(deltas)) if len(deltas) > 0 else 0
        spike_count = np.sum(np.abs(deltas) > 0.15 * mean_power)

        slope = self._compute_slope(powers)
        oscillations = self._zero_crossings(deltas)

        return {
            "mean_power": mean_power,
            "max_power": max_power,
            "min_power": min_power,
            "std_power": std_power,
            "range_power": range_power,
            "coef_var": coef_var,
            "max_delta": max_delta,
            "mean_delta": mean_delta,
            "spike_count": spike_count,
            "slope": slope,
            "oscillations": oscillations
        }

    def _compute_slope(self, powers):
        x = np.arange(len(powers))
        if len(powers) < 2:
            return 0
        slope = np.polyfit(x, powers, 1)[0]
        return slope

    def _zero_crossings(self, deltas):
        if len(deltas) < 2:
            return 0
        return np.sum(np.diff(np.sign(deltas)) != 0)


