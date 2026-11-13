import time
import numpy as np
import matplotlib
matplotlib.use("Agg")                      # save the plot to a file, no window needed
import matplotlib.pyplot as plt
from pathlib import Path
from terrain import Dem
from horizon import horizon

ROOT = Path(__file__).resolve().parent.parent
T = ROOT / "pipeline" / "data" / "terrain"
d20  = Dem(T / "LDEM_80S_20MPP_ADJ.TIF")
d240 = Dem(T / "LDEM_60S_240MPP_ADJ.TIF")

LAT, LON = -89.4395, 222.8066          # Connecting Ridge spot, plan test V10 (Gläser 2014)
az = np.arange(0, 360, 0.5)            # 720 directions
rings = [([d20, d240], 0, 40_000),     # near field: 20 m terrain, 240 m fills any gaps
         ([d240], 40_000, 250_000)]    # far field

t0 = time.time()
hz, h0 = horizon(LAT, LON, rings, az)
print(f"took {time.time() - t0:.0f} s")
print(f"site height: {h0:.1f} m")
print(f"horizon min/mean/max: {hz.min():.2f} / {hz.mean():.2f} / {hz.max():.2f} deg")
print("directions with no data:", int((hz <= -89.9).sum()))   # should be 0

plt.figure(figsize=(14, 3.5))
plt.fill_between(az, hz, hz.min() - 1, color="k")
plt.xlim(0, 360)
plt.xlabel("azimuth (deg)"); plt.ylabel("horizon elevation (deg)")
plt.title(f"Horizon at {LAT}, {LON}")
plt.tight_layout()
plt.savefig(ROOT / "docs" / "horizon_V10.png", dpi=150)
print("saved docs/horizon_V10.png")
