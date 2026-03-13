import random
import math

class ArchetypeLighting:
    """Simulates a stable resistive load like a lightbulb."""
    def __init__(self, fault_mode=None):
        self.power = 35.0
        self.noise = 0.02
        self.fault_mode = fault_mode

    def step(self, t):
        base = self.power
        if self.fault_mode != None:
            base += 6 * math.sin(t * 3)
        return max(base + random.gauss(0, self.noise), 0)

class ArchetypeSmallMotor:
    """Simulates small motors with mechanical ripple (e.g., Fans)."""
    def __init__(self, fault_mode=None):
        self.power = 85.0
        self.phase = 0.0
        self.fault_mode = fault_mode

    def step(self, t):
        self.phase += 0.25
        ripple = 4.0 * math.sin(self.phase)
        noise = random.gauss(0, 0.5)
        
        base = self.power
        if self.fault_mode != None:
            ripple *= 1.8
            noise *= 2
            base *= 1.15

        return max(base + ripple + noise, 0)

class ArchetypeThermal:
    """High-power resistive load simulation (e.g., Heaters)."""
    def __init__(self, fault_mode=None):
        self.power = 1200.0
        self.noise = 2.0
        self.fault_mode = fault_mode

    def step(self, t):
        base = self.power
        noise = self.noise * 4 if self.fault_mode != None else self.noise
        if self.fault_mode != None:
            base *= 0.8
            
        return max(base + random.gauss(0, noise), 0)

class ArchetypeHVAC:
    """Compressor-based load simulation (e.g., Fridges)."""
    def __init__(self, fault_mode=None):
        self.power = 160.0
        self.noise = 1.5
        self.fault_mode = fault_mode

    def step(self, t):
        base = self.power
        noise = self.noise * 3 if self.fault_mode != None else self.noise
        if self.fault_mode != None:
            base *= 0.7

        return max(base + random.gauss(0, noise), 0)

class ArchetypeLaundry:
    """High-jitter spinning load simulation (e.g., Washing Machines)."""
    def __init__(self, fault_mode=None):
        self.power = 528.0
        self.noise = 45.0
        self.fault_mode = fault_mode

    def step(self, t):
        noise = self.noise * 2 if self.fault_mode != None else self.noise
        return max(self.power + random.gauss(0, noise), 0)