import numpy as np

def waveform_to_power_series(voltage, current, fs=30000, target_hz=10):
    """
    Convert high-frequency waveform into low-frequency smart-plug observable signal.
    Returns power time-series (~target_hz samples/sec).
    """

    # 1) instantaneous power
    power = voltage * current

    # 2) cycle RMS envelope (simulate metering IC)
    mains_freq = 60
    samples_per_cycle = int(fs / mains_freq)

    usable_len = len(power) // samples_per_cycle * samples_per_cycle
    power = power[:usable_len]

    cycles = power.reshape(-1, samples_per_cycle)
    envelope = np.sqrt(np.mean(cycles**2, axis=1))

    # 3) smoothing (~100ms)
    window = 6
    smooth = np.convolve(envelope, np.ones(window)/window, mode="same")

    # 4) downsample
    duration_sec = len(smooth) / mains_freq
    desired_samples = int(duration_sec * target_hz)
    factor = max(1, len(smooth) // desired_samples)

    resampled = smooth[::factor]

    return resampled
