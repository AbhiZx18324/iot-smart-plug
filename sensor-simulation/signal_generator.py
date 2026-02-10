# signal_generator.py

import time
import numpy as np
from appliance_profiles import APPLIANCE_PROFILES


class SmartPlugSimulator:
    def __init__(self, appliance_name, plug_id="plug_001"):
        self.profile = APPLIANCE_PROFILES[appliance_name]
        self.appliance_name = appliance_name
        self.plug_id = plug_id

        self.state = "OFF"
        self.state_start_time = None

        self.nominal_voltage = 230.0  # Volts

    def turn_on(self):
        self.state = "TRANSIENT"
        self.state_start_time = time.time()

    def turn_off(self):
        self.state = "OFF"
        self.state_start_time = None

    def _simulate_voltage(self):
        return self.nominal_voltage + np.random.normal(0, 1.0)

    def _simulate_power(self):
        rated = self.profile["rated_power"]

        if self.state == "OFF":
            return 0.0

        elif self.state == "TRANSIENT":
            elapsed = time.time() - self.state_start_time
            if elapsed >= self.profile["transient_duration"]:
                self.state = "STEADY"
                self.state_start_time = time.time()
                return rated
            return rated * self.profile["turn_on_spike_factor"]

        elif self.state == "STEADY":
            sigma = self.profile["steady_noise_sigma"]
            noise = np.random.normal(0, sigma * rated)
            return max(0, rated + noise)

    def sample(self):
        voltage = self._simulate_voltage()
        power = self._simulate_power()
        current = power / voltage if voltage > 0 else 0.0

        return {
            "plug_id": self.plug_id,
            "voltage_rms": round(voltage, 2),
            "current_rms": round(current, 3),
            "power_active": round(power, 2),
            "frequency": 50.0,
            "relay": "ON" if self.state != "OFF" else "OFF",
            "appliance_truth": self.appliance_name
        }
