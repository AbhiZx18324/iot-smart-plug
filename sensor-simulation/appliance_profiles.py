# appliance_profiles.py

APPLIANCE_PROFILES = {
    "fan": {
        "rated_power": 75,              # Watts
        "turn_on_spike_factor": 1.4,
        "transient_duration": 2.0,       # seconds
        "steady_noise_sigma": 0.05,      # 5%
        "duty_cycle": "continuous"
    },

    "laptop": {
        "rated_power": 65,
        "turn_on_spike_factor": 1.6,
        "transient_duration": 3.0,
        "steady_noise_sigma": 0.10,
        "duty_cycle": "variable"
    },

    "led_bulb": {
        "rated_power": 10,
        "turn_on_spike_factor": 1.05,
        "transient_duration": 0.5,
        "steady_noise_sigma": 0.02,
        "duty_cycle": "continuous"
    },

    "ac": {
        "rated_power": 1500,
        "turn_on_spike_factor": 2.5,
        "transient_duration": 5.0,
        "steady_noise_sigma": 0.15,
        "duty_cycle": "cyclic"
    }
}
