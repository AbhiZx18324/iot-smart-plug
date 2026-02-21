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

class SmallMotorElectronics:
    """
    Matched to stats: mean~137W, std~3.2, spike~1.35, settle~5s
    """
    def __init__(self):
        self.power = sample_positive(137, 260, 15)
        self.noise = sample_positive(3.2, 4.3)
        self.spike = sample_positive(1.35, 0.58, 1.0)
        self.settle = bounded_int(5, 4.9)
        self.phase = random.uniform(0, 2*math.pi)

    def step(self, t):
        self.phase += 0.25
        # Keep mechanical ripple small and within standard deviation limits
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

class HVACRefrigeration:
    """
    Matched to stats: mean~670W, std~24.8, spike~2.57, settle~13.5s
    Fixed the time.time() bug to restore 10Hz resolution transient.
    """
    def __init__(self):
        self.power = sample_positive(670, 1119, 50)
        self.noise = sample_positive(24.8, 96)
        self.spike = sample_positive(2.57, 2.39, 1.1)
        self.settle = bounded_int(13.5, 10)
        
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