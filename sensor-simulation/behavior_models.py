import random, math

def sample_positive(mean, std, minimum=0.1):
    return max(minimum, random.gauss(mean, std))

def bounded_int(mean, std, low=1):
    return max(low, int(random.gauss(mean, std)))

class LightingLoad:
    """
    Matched to stats: mean~35W, std~0.3, spike~1.4, settle~5s
    Added the missing cold-filament inrush spike.
    """
    def __init__(self):
        self.power = sample_positive(35, 20, 5) 
        self.noise = sample_positive(0.3, 0.1)
        self.spike = sample_positive(1.4, 0.39, 1.0)
        self.settle = bounded_int(5, 3.6)

    def step(self, t):
        steady = self.power + random.gauss(0, self.noise)
        if t < self.settle:
            # Decays smoothly down to the steady baseline
            transient = self.power * (self.spike - 1.0) * math.exp(-t / (self.settle / 3))
            return max(steady + transient, 0)
        return max(steady, 0)

class LowPowerMotorElectronics:
    """For Fans and Laptops (20W - 80W)"""
    def __init__(self):
        self.power = sample_positive(45, 15, 15) # Mean 45W, Std 15W
        self.noise = sample_positive(1.5, 1.0)
        self.spike = sample_positive(1.2, 0.2, 1.0)
        self.settle = bounded_int(3, 1.0)
        self.phase = random.uniform(0, 2 * 3.14159)

    def step(self, t):
        self.phase += 0.25
        ripple = (self.noise * 0.5) * math.sin(self.phase)
        steady = self.power + ripple + random.gauss(0, self.noise * 0.5)
        
        if t < self.settle:
            transient = self.power * (self.spike - 1.0) * math.exp(-t / (self.settle / 3))
            return max(steady + transient, 0)
        return max(steady, 0)

class HighPowerMotor:
    """For Vacuum Cleaners (~800W - 1400W)"""
    def __init__(self):
        self.power = sample_positive(1100, 200, 600) # Mean 1100W, Std 200W
        self.noise = sample_positive(15.0, 5.0)
        self.spike = sample_positive(1.6, 0.4, 1.0)
        self.settle = bounded_int(6, 2.0)
        self.phase = random.uniform(0, 2 * 3.14159)

    def step(self, t):
        self.phase += 0.4 # Faster ripple for high speed motors
        ripple = (self.noise * 0.5) * math.sin(self.phase)
        steady = self.power + ripple + random.gauss(0, self.noise * 0.5)
        
        if t < self.settle:
            transient = self.power * (self.spike - 1.0) * math.exp(-t / (self.settle / 3))
            return max(steady + transient, 0)
        return max(steady, 0)

class ThermalAppliance:
    """
    Matched to stats: mean~1128W, std~60.9, spike~1.08, settle~10.7s
    Removed the massive sine wave to respect the ~60.9 std.
    """
    def __init__(self):
        self.power = sample_positive(1128, 579, 100)
        self.noise = sample_positive(60.9, 145)
        self.spike = sample_positive(1.08, 0.2, 1.0)
        self.settle = bounded_int(11, 10)

    def step(self, t):
        steady = self.power + random.gauss(0, self.noise)
        if t < self.settle:
            transient = self.power * (self.spike - 1.0) * math.exp(-t / (self.settle / 3))
            return max(steady + transient, 0)
        return max(steady, 0)

class Refrigerator:
    """Matched to typical Fridge: ~200W steady, big compressor spike"""
    def __init__(self):
        self.power = sample_positive(200, 50, 100) 
        self.noise = sample_positive(5.0, 2.0)
        self.spike = sample_positive(3.0, 0.8, 1.5) # High inrush current
        self.settle = bounded_int(8, 2.0)
        
        self.on_duration = random.randint(20, 60)
        self.off_duration = random.randint(20, 60)

    def step(self, t):
        cycle = t % (self.on_duration + self.off_duration)
        if cycle > self.on_duration:
            return random.uniform(0, 5)  # Standby
            
        steady = self.power + random.gauss(0, self.noise)
        if cycle < self.settle:
            transient = self.power * (self.spike - 1.0) * math.exp(-cycle / (self.settle / 3))
            return max(steady + transient, 0)
        return max(steady, 0)

class AirConditioner:
    """Matched strictly to 120V Window ACs in the PLAID Dataset"""
    def __init__(self):
        # 1. Steady state set to a typical window AC load
        self.power = sample_positive(650, 100, 400) 
        self.noise = sample_positive(15.0, 5.0)
        
        # 2. CRITICAL FIX: Drastically reduce the spike multiplier.
        # A 650W AC * 1.8 spike = ~1170W peak, which perfectly matches PLAID.
        self.spike = sample_positive(1.8, 0.2, 1.2) 
        
        # 3. Faster settle time (window AC compressors spin up quickly)
        self.settle = bounded_int(10, 2.0)
        
        self.on_duration = random.randint(40, 120)
        self.off_duration = random.randint(20, 60)

    def step(self, t):
        cycle = t % (self.on_duration + self.off_duration)
        if cycle > self.on_duration:
            return random.uniform(0, 5)  # Standby
            
        steady = self.power + random.gauss(0, self.noise)
        if cycle < self.settle:
            transient = self.power * (self.spike - 1.0) * math.exp(-cycle / (self.settle / 3))
            return max(steady + transient, 0)
        return max(steady, 0)    

class LaundryAppliance:
    """
    Matched to stats: mean~528W, std~45.7, spike~2.75, settle~12.5s
    Fixed the time.time() bug.
    """
    def __init__(self):
        self.base = sample_positive(528, 411, 50)
        self.noise = sample_positive(45.7, 60.5)
        self.spike = sample_positive(2.75, 1.26, 1.1)
        self.settle = bounded_int(12.5, 15)

    def step(self, t):
        stage_duration = 20
        stage = int(t / stage_duration) % 3
        time_in_stage = t % stage_duration
        
        if stage == 0:   # tumble
            target_power = self.base * 0.4
        elif stage == 1: # spin
            target_power = self.base * 1.2
        else:            # idle soak
            target_power = random.uniform(0, 10)
            
        steady = target_power + random.gauss(0, self.noise if stage != 2 else 2.0)
        
        # Apply transient when a new active stage starts
        if time_in_stage < self.settle and stage != 2:
            transient = target_power * (self.spike - 1.0) * math.exp(-time_in_stage / (self.settle / 3))
            return max(steady + transient, 0)
            
        return max(steady, 0)