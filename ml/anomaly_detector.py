import json
import numpy as np


class AnomalyDetector:
    def __init__(self, stats_path):
        with open(stats_path, "r") as f:
            self.stats = json.load(f)

    def score(self, feature_vector, class_label):
        """
        Returns anomaly score (mean absolute z-score)
        """
        if class_label not in self.stats:
            return 0.0

        mean_vec = np.array(self.stats[class_label]["mean"])
        std_vec = np.array(self.stats[class_label]["std"])

        x = np.array(feature_vector)

        z = np.abs((x - mean_vec) / std_vec)

        return float(np.mean(z))

    def is_anomaly(self, feature_vector, class_label, threshold=2.5):
        score = self.score(feature_vector, class_label)
        return score > threshold, score