APPLIANCE_PROFILES = {

    "fan": {
        "type": "motor",
        "rated_power": 75,
        "startup_spike": 1.8,
        "startup_duration": 2,
        "variance": 0.03
    },

    "kettle": {
        "type": "resistive",
        "rated_power": 1500,
        "variance": 0.01
    },

    "laptop": {
        "type": "smps",
        "rated_power": 65,
        "variance": 0.12,
        "burst_prob": 0.2
    },

    "ac": {
        "type": "compressor",
        "rated_power": 1400,
        "standby_power": 8,
        "startup_spike": 2.5,
        "startup_duration": 3,
        "cycle_on": (40, 90),   # seconds range
        "cycle_off": (20, 60),
        "variance": 0.03
    }
}

