"""Generate a quiet, gapless 32-second wind and birds loop for /life."""

from array import array
import math
from pathlib import Path
import random
import wave


RATE = 24000
LOOP_SECONDS = 32
OVERLAP_SECONDS = 4
LOOP_SAMPLES = RATE * LOOP_SECONDS
OVERLAP_SAMPLES = RATE * OVERLAP_SECONDS

random.seed(37)
low = mid = high = 0.0
wind = array("f")
for _ in range(LOOP_SAMPLES + OVERLAP_SAMPLES):
    noise = random.uniform(-1, 1)
    low += 0.002 * (noise - low)
    mid += 0.026 * (noise - mid)
    high += 0.11 * (noise - high)
    wind.append(1.6 * (mid - low) + 0.09 * (high - mid))


def bird_call(samples: array, start: float, base_frequency: float, count: int) -> None:
    """Add one soft, varied phrase of short whistle-like chirps."""
    for note in range(count):
        duration = 0.14 + 0.025 * ((note + count) % 3)
        onset = start + note * (0.24 + 0.04 * (note % 2))
        first = int(onset * RATE)
        phase = 0.0
        for j in range(int(duration * RATE)):
            index = first + j
            if index >= len(samples):
                break
            progress = j / (duration * RATE)
            frequency = base_frequency * (1 + 0.18 * math.sin(math.pi * progress))
            frequency += 210 * math.sin(2 * math.pi * progress)
            phase += 2 * math.pi * frequency / RATE
            envelope = math.sin(math.pi * progress) ** 2
            trill = 0.86 + 0.14 * math.sin(2 * math.pi * progress * 4)
            samples[index] += 1250 * envelope * trill * (
                math.sin(phase) + 0.14 * math.sin(2 * phase)
            )


output = array("h", [0]) * LOOP_SAMPLES
for index in range(LOOP_SAMPLES):
    t = index / RATE
    if index < OVERLAP_SAMPLES:
        blend = index / OVERLAP_SAMPLES
        noise = wind[LOOP_SAMPLES + index] * (1 - blend) + wind[index] * blend
    else:
        noise = wind[index]
    swell = 0.72 + 0.15 * math.sin(2 * math.pi * t / 16) + 0.07 * math.sin(2 * math.pi * t / 8)
    output[index] = int(noise * 3500 * swell)

bird_mix = array("f", output)
for start, frequency, count in [
    (3.6, 1780, 3), (7.9, 2080, 4), (12.7, 1630, 3),
    (17.4, 2260, 3), (22.5, 1860, 4), (27.3, 2010, 3),
]:
    bird_call(bird_mix, start, frequency, count)

for index, value in enumerate(bird_mix):
    output[index] = max(-32768, min(32767, round(value)))

destination = Path(__file__).resolve().parents[1] / "public/life/painterly-ambience.wav"
with wave.open(str(destination), "wb") as audio:
    audio.setnchannels(1)
    audio.setsampwidth(2)
    audio.setframerate(RATE)
    audio.writeframes(output.tobytes())
