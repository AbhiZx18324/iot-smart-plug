from signal_generator import SmartPlugSimulator
import time

sim = SmartPlugSimulator("fan")
sim.turn_on()

for _ in range(10):
    print(sim.sample())
    time.sleep(1)

sim.turn_off()
print(sim.sample())
