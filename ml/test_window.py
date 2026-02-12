from window_processor import SlidingWindowProcessor
import random
import time

processor = SlidingWindowProcessor()

for i in range(60):
    power = 75 + random.normalvariate(0, 2)
    features = processor.add_sample(time.time(), power)

    if features:
        print(features)
