import random

def normal_clipped(mean, std, min_val=0):
    """Sample positive normal values safely."""
    val = random.gauss(mean, std)
    return max(min_val, val)

def sample_fan():
    return {
        "type": "motor",
        "rated_power": normal_clipped(60, 15),
        "steady_noise": normal_clipped(0.7, 0.3),
        "startup_spike": normal_clipped(1.05, 0.05),
        "settling_time": int(normal_clipped(5, 2, 2))
    }
