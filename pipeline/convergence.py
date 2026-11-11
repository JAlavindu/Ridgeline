import numpy as np
from pathlib import Path
from terrain import Dem
from horizon import horizon

T = Path(__file__).resolve().parent / "data" / "terrain"
d20  = Dem(T / "LDEM_80S_20MPP_ADJ.TIF")
d80  = Dem(T / "LDEM_80S_80MPP_ADJ.TIF")
d240 = Dem(T / "LDEM_60S_240MPP_ADJ.TIF")
LAT, LON = -89.4395, 222.8066

def run(step_frac=0.01, far_km=250, az_step=0.5, far=None):
    az = np.arange(0, 360, az_step)
    far = far or [d240]
    rings = [([d20, d240], 0, 40_000), (far, 40_000, far_km * 1000)]
    return horizon(LAT, LON, rings, az, step_frac=step_frac)[0]

base = run()
tests = {"half step":      run(step_frac=0.005),
         "double range":   run(far_km=500),
         "0.25 deg az":    run(az_step=0.25)[::2],     # every second value lines up with the 0.5 deg grid
         "80 m far field": run(far=[d80, d240])}
for name, hz in tests.items():
    d = hz - base
    print(f"{name:15s} RMS {np.sqrt(np.mean(d**2)):.4f} deg   max {np.abs(d).max():.4f} deg")
hz25 = run(az_step=0.25)
mid = (base + np.roll(base, -1)) / 2          # base value halfway between neighbouring azimuths
d = hz25[1::2] - mid
print(f"{'0.25 deg in-between':19s} RMS {np.sqrt(np.mean(d**2)):.4f} deg   max {np.abs(d).max():.4f} deg")

# is the step converged? compare 0.005 with 0.0025
d = run(step_frac=0.0025) - run(step_frac=0.005)
print(f"{'step 0.0025 v 0.005':19s} RMS {np.sqrt(np.mean(d**2)):.4f} deg   max {np.abs(d).max():.4f} deg")
