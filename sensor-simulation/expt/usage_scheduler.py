# usage_scheduler.py

import time
import random
from usage_profiles import USAGE_PROFILES


class UsageScheduler:
    def __init__(self, appliance_name):
        self.profile = USAGE_PROFILES[appliance_name]
        self.state = "OFF"
        self.next_event_time = time.time()

    def _sample_duration(self, mean_time):
        # Exponential distribution = realistic human usage
        return random.expovariate(1 / mean_time)

    def update(self, simulator):
        now = time.time()

        if now < self.next_event_time:
            return

        if self.state == "OFF":
            simulator.turn_on()
            self.state = "ON"
            duration = self._sample_duration(self.profile["mean_on_time"])
        else:
            simulator.turn_off()
            self.state = "OFF"
            duration = self._sample_duration(self.profile["mean_off_time"])

        self.next_event_time = now + duration
