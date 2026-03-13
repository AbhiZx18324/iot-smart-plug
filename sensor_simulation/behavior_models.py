import random, math

# class ArchetypeLighting:
#     """A lightbulb is a perfectly flat resistive load."""
#     def __init__(self, fault_mode=None):
#         self.power = 35.0
#         self.noise = 0.02 # Dropped to near-zero to kill false oscillations
#         self.fault_mode = fault_mode

#     def step(self, t):
#         return max(self.power + random.gauss(0, self.noise), 0)

class ArchetypeLighting:
    def __init__(self, fault_mode=None):
        self.power = 35.0
        self.noise = 0.02
        self.fault_mode = fault_mode

    def step(self, t):
        base = self.power

        if self.fault_mode == "flicker":
            base += 6 * math.sin(t*3)

        return max(base + random.gauss(0, self.noise), 0)
    
# class ArchetypeSmallMotor:
#     """Moved to 85W (dead center of the 60W-115W motor zone)"""
#     def __init__(self):
#         self.power = 85.0
#         self.phase = 0.0

#     def step(self, t):
#         self.phase += 0.25
#         # Stronger mechanical sine ripple (~4W) guarantees motor classification
#         ripple = 4.0 * math.sin(self.phase) 
#         return max(self.power + ripple + random.gauss(0, 0.5), 0)

class ArchetypeSmallMotor:
    """Moved to 85W (dead center of the 60W-115W motor zone)"""
    def __init__(self, fault_mode=None):
        self.power = 85.0
        self.phase = 0.0
        self.fault_mode = fault_mode

    def step(self, t):
        self.phase += 0.25
        ripple = 4.0 * math.sin(self.phase)

        noise = random.gauss(0, 0.5)

        if self.fault_mode == "bearing_wear":
            ripple *= 1.8
            noise *= 2
            base = self.power * 1.15
        else:
            base = self.power

        return max(base + ripple + noise, 0)

# class ArchetypeThermal:
#     """Center of Thermal zone: 1200W, very stable high power"""
#     def __init__(self, fault_mode=None):
#         self.power = 1200.0
#         self.noise = 2.0 # Reduced from 60.9 to stop Washing Machine misclassification
#         self.fault_mode = fault_mode

#     def step(self, t):
#         return max(self.power + random.gauss(0, self.noise), 0)

class ArchetypeThermal:
    def __init__(self, fault_mode=None):
        self.power = 1200.0
        self.noise = 2.0
        self.fault_mode = fault_mode

    def step(self, t):
        base = self.power

        if self.fault_mode == "coil_damage":
            base *= 0.8
            noise = self.noise * 4
        else:
            noise = self.noise

        return max(base + random.gauss(0, noise), 0)

# class ArchetypeHVAC:
#     """Center of Refrigerator zone: ~160W, low high-frequency jitter"""
#     def __init__(self, fault_mode=None):
#         self.power = 160.0
#         self.noise = 1.5
#         self.fault_mode = fault_mode

#     def step(self, t):
#         return max(self.power + random.gauss(0, self.noise), 0)

class ArchetypeHVAC:
    def __init__(self, fault_mode=None):
        self.power = 160.0
        self.noise = 1.5
        self.fault_mode = fault_mode

    def step(self, t):
        base = self.power

        if self.fault_mode == "compressor_degradation":
            base *= 0.7
            noise = self.noise * 3
        else:
            noise = self.noise

        return max(base + random.gauss(0, noise), 0)

# class ArchetypeLaundry:
#     """Locked strictly to the PLAID snapshot: 528W mean, 45W jitter"""
#     def __init__(self, fault_mode=None):
#         self.power = 528.0
#         # The 45W noise is the true PLAID signature for the drum spinning
#         self.noise = 45.0 
#         self.fault_mode = fault_mode

#     def step(self, t):
#         return max(self.power + random.gauss(0, self.noise), 0)

class ArchetypeLaundry:
    def __init__(self, fault_mode=None):
        self.power = 528.0
        self.noise = 45.0
        self.fault_mode = fault_mode

    def step(self, t):
        base = self.power

        if self.fault_mode == "drum_imbalance":
            noise = self.noise * 2
        else:
            noise = self.noise

        return max(base + random.gauss(0, noise), 0)