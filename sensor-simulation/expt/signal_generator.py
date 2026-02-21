import time
import numpy as np

from behavior_models import (
    ArchetypeLighting,
    ArchetypeSmallMotor,
    ArchetypeThermal,
    ArchetypeHVAC,
    ArchetypeLaundry
)

APPLIANCE_CLASS_MAP = {
    "Fan": ArchetypeSmallMotor,
    "Vacuum": ArchetypeSmallMotor,
    "Laptop": ArchetypeSmallMotor,

    "Incandescent Light Bulb": ArchetypeLighting,
    "Compact Fluorescent Lamp": ArchetypeLighting,

    "Heater": ArchetypeThermal,
    "Microwave": ArchetypeThermal,
    "Hairdryer": ArchetypeThermal,

    "Fridge": ArchetypeHVAC,
    "Air Conditioner": ArchetypeHVAC,

    "Washing Machine": ArchetypeLaundry
}

class SmartPlugSimulator:
    def __init__(self, appliance_name, plug_id="plug_001"):
        self.appliance_name = appliance_name
        self.plug_id = plug_id
        self.state = "OFF"
        self.start_time = None

        self.nominal_voltage = 230.0

        # Instantiate the locked-center behavior model
        model_class = APPLIANCE_CLASS_MAP[appliance_name]
        self.device = model_class()

    def turn_on(self):
        self.state = "ON"
        self.start_time = time.time()

    def turn_off(self):
        self.state = "OFF"

    def _simulate_voltage(self):
        return self.nominal_voltage + np.random.normal(0, 1.0)

    def sample(self):
        voltage = self._simulate_voltage()

        if self.state == "OFF":
            power = 0.0
        else:
            t = time.time() - self.start_time
            power = self.device.step(t)

        current = power / voltage if voltage > 0 else 0.0

        return {
            "plug_id": self.plug_id,
            "voltage_rms": round(voltage, 2),
            "current_rms": round(current, 3),
            "power_active": round(power, 2),
            "frequency": 50.0,
            "relay": "ON" if self.state == "ON" else "OFF",
            "appliance_truth": self.appliance_name
        }