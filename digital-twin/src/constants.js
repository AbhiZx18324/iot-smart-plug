export const APPLIANCES = [
  { id: 'Fan', name: 'Fan', icon: '🌀', category: 'SMALL_MOTOR_ELECTRONICS', fault: 'bearing_wear' },
  { id: 'Laptop', name: 'Laptop', icon: '💻', category: 'SMALL_MOTOR_ELECTRONICS', fault: 'bearing_wear' },
  { id: 'Vacuum', name: 'Vacuum', icon: '🧹', category: 'SMALL_MOTOR_ELECTRONICS', fault: 'bearing_wear' },
  { id: 'Incandescent Light Bulb', name: 'Incandescent Bulb', icon: '💡', category: 'LIGHTING_LOADS', fault: 'flicker' },
  { id: 'Compact Fluorescent Lamp', name: 'CFL Lamp', icon: '🔆', category: 'LIGHTING_LOADS', fault: 'flicker' },
  { id: 'Heater', name: 'Heater', icon: '🔥', category: 'THERMAL_APPLIANCES', fault: 'coil_damage' },
  { id: 'Microwave', name: 'Microwave', icon: '📡', category: 'THERMAL_APPLIANCES', fault: 'coil_damage' },
  { id: 'Hairdryer', name: 'Hairdryer', icon: '💨', category: 'THERMAL_APPLIANCES', fault: 'coil_damage' },
  { id: 'Fridge', name: 'Fridge', icon: '❄️', category: 'HVAC_REFRIGERATION', fault: 'compressor_degradation' },
  { id: 'Air Conditioner', name: 'Air Conditioner', icon: '🌡️', category: 'HVAC_REFRIGERATION', fault: 'compressor_degradation' },
  { id: 'Washing Machine', name: 'Washing Machine', icon: '🫧', category: 'LAUNDRY_APPLIANCES', fault: 'drum_imbalance' },
];

export const LOAD_CLASS_LABELS = {
  "SMALL_MOTOR_ELECTRONICS": "Small Motor / Electronics",
  "LIGHTING_LOADS": "Lighting Loads",
  "THERMAL_APPLIANCES": "Thermal Appliances",
  "HVAC_REFRIGERATION": "HVAC / Refrigeration",
  "LAUNDRY_APPLIANCES": "Laundry / High-Jitter"
};
