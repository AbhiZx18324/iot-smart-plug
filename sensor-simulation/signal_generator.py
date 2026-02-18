# signal_generator.py

import random
import time
import math
import numpy as np
from appliance_profiles import APPLIANCE_PROFILES
from profile_sampler import sample_fan


class SmartPlugSimulator:
    def __init__(self, appliance_name, plug_id="plug_001"):
        self.profile = APPLIANCE_PROFILES[appliance_name]
        # self.profile = sample_fan()
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
        profile = self.profile
        t = time.time()

        if self.state == "OFF":
            return 0

        if profile["type"] == "compressor":
            return self._compressor_power(profile, t)

        if profile["type"] == "motor":
            return self._motor_power(profile, t)

        if profile["type"] == "resistive":
            return self._resistive_power(profile, t)

        if profile["type"] == "smps":
            return self._smps_power(profile, t)

        return 0

    def _compressor_power(self, profile, t):
        if not hasattr(self, "cycle_state"):
            self.cycle_state = "OFF"
            self.next_toggle = t

        if t >= self.next_toggle:
            if self.cycle_state == "OFF":
                self.cycle_state = "STARTUP"
                self.next_toggle = t + profile["startup_duration"]
            elif self.cycle_state == "STARTUP":
                self.cycle_state = "RUN"
                self.next_toggle = t + random.randint(*profile["cycle_on"])
            else:
                self.cycle_state = "OFF"
                self.next_toggle = t + random.randint(*profile["cycle_off"])

        if self.cycle_state == "OFF":
            return profile["standby_power"] * (1 + random.uniform(-0.1, 0.1))

        if self.cycle_state == "STARTUP":
            return profile["rated_power"] * profile["startup_spike"]

        return profile["rated_power"] * (1 + random.uniform(-profile["variance"], profile["variance"]))

    def _motor_power(self, profile, t):
        if not hasattr(self, "start_time"):
            self.start_time = t

        elapsed = t - self.start_time

        steady = profile["rated_power"]
        spike = steady * profile["startup_spike"]
        tau = profile["settling_time"] / 3  # exponential reaches ~95% in ~3τ

        if elapsed < profile["settling_time"]:
            power = steady + (spike - steady) * math.exp(-elapsed / tau)
        else:
            if not hasattr(self, "motor_state"):
                self.motor_state = steady

            target = steady + random.gauss(0, profile["steady_noise"])

            alpha = 0.2  # inertia factor (0 = frozen, 1 = instant change)
            self.motor_state += alpha * (target - self.motor_state)

            power = self.motor_state

        return max(power, 0)

    def _resistive_power(self, profile, t):
        return profile["rated_power"] * (1 + random.uniform(-profile["variance"], profile["variance"]))

    def _smps_power(self, profile, t):
        base = profile["rated_power"] * (1 + random.uniform(-profile["variance"], profile["variance"]))
        if random.random() < profile["burst_prob"]:
            base *= random.uniform(0.5, 1.5)
        return base

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
