import json
import numpy as np

class AnomalyDetector:
    def __init__(self, stats_path):
        try:
            with open(stats_path, "r") as f:
                self.stats = json.load(f)
        except (FileNotFoundError, json.JSONDecodeError):
            self.stats = {}

    def score(self, feature_vector, class_label):
        r"""
        Calculates the Mean Absolute Z-Score. 
        $Z = \frac{|x - \mu|}{\sigma}$
        """
        if class_label not in self.stats:
            return 0.0

        stats = self.stats[class_label]
        mu = np.array(stats["mean"])
        sigma = np.array(stats["std"])
        x = np.array(feature_vector)

        # Standardize and average across all features
        z_scores = np.abs((x - mu) / sigma)
        return float(np.mean(z_scores))

    def is_anomaly(self, feature_vector, class_label, threshold=2.5):
        score = self.score(feature_vector, class_label)
        return score > threshold, score