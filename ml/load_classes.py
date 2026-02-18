ID2LABEL = {
    1: "Air Conditioner",
    2: "Compact Fluorescent Lamp",
    3: "Fan",
    4: "Fridge",
    5: "Hairdryer",
    6: "Heater",
    7: "Incandescent Light Bulb",
    8: "Laptop",
    9: "Microwave",
    10: "Vacuum",
    11: "Washing Machine"
}

LOAD_CLASS_MAP = {
    "Air Conditioner": "COMPRESSOR_CYCLIC",
    "Fridge": "COMPRESSOR_CYCLIC",

    "Fan": "MOTOR_STEADY",

    "Vacuum": "MOTOR_COMPLEX",
    "Washing Machine": "MOTOR_COMPLEX",
    "Hairdryer": "MOTOR_COMPLEX",

    "Heater": "RESISTIVE_STABLE",
    "Incandescent Light Bulb": "RESISTIVE_STABLE",

    "Laptop": "POWER_ELECTRONICS",
    "Compact Fluorescent Lamp": "POWER_ELECTRONICS",

    "Microwave": "PULSED_HIGH_POWER"
}
